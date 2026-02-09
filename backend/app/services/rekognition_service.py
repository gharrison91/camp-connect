"""
Camp Connect - AWS Rekognition Service
Facial recognition integration for identifying campers in photos.

Uses AWS Rekognition to:
  - Maintain per-organization face collections
  - Index known camper faces from reference photos
  - Search uploaded photos for matching camper faces
  - Clean up face data when campers are removed

Note: boto3 is synchronous, so all functions in this module are regular
(non-async). Call from async code via asyncio.to_thread() or run_in_executor().
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import boto3
from botocore.exceptions import ClientError

from app.config import settings

logger = logging.getLogger(__name__)

# Lazy-initialized Rekognition client
_rekognition_client = None


def _get_rekognition_client():
    """
    Lazy-init the boto3 Rekognition client using credentials from settings.

    Returns the shared client instance, creating it on first call.
    """
    global _rekognition_client
    if _rekognition_client is None:
        _rekognition_client = boto3.client(
            "rekognition",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region,
        )
    return _rekognition_client


def _collection_id(organization_id) -> str:
    """
    Generate a unique Rekognition collection ID for an organization.

    Format: campconnect-{org_uuid}
    """
    return f"campconnect-{organization_id}"


def ensure_collection(organization_id) -> str:
    """
    Ensure a Rekognition collection exists for the organization.

    Creates the collection if it does not already exist. Returns the
    collection ID regardless.

    Args:
        organization_id: The organization UUID.

    Returns:
        The Rekognition collection ID string.
    """
    client = _get_rekognition_client()
    collection = _collection_id(organization_id)

    try:
        client.create_collection(CollectionId=collection)
        logger.info(f"Created Rekognition collection: {collection}")
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        if error_code == "ResourceAlreadyExistsException":
            logger.debug(f"Rekognition collection already exists: {collection}")
        else:
            logger.error(f"Failed to create Rekognition collection: {e}")
            raise

    return collection


def index_camper_face(
    organization_id,
    camper_id,
    image_bytes: bytes,
) -> Optional[str]:
    """
    Index a camper's face in the organization's Rekognition collection.

    Uses the camper_id as the ExternalImageId so matched faces can be
    traced back to the camper record.

    Args:
        organization_id: The organization UUID.
        camper_id: The camper UUID (used as ExternalImageId).
        image_bytes: Raw bytes of the camper's reference photo.

    Returns:
        The FaceId string from Rekognition if a face was detected,
        or None if no face was found in the image.
    """
    client = _get_rekognition_client()
    collection = ensure_collection(organization_id)

    try:
        response = client.index_faces(
            CollectionId=collection,
            Image={"Bytes": image_bytes},
            ExternalImageId=str(camper_id),
            MaxFaces=1,
            QualityFilter="AUTO",
            DetectionAttributes=["DEFAULT"],
        )

        face_records = response.get("FaceRecords", [])
        if not face_records:
            logger.warning(
                f"No face detected in image for camper {camper_id}"
            )
            return None

        face_id = face_records[0]["Face"]["FaceId"]
        confidence = face_records[0]["Face"]["Confidence"]
        logger.info(
            f"Indexed face for camper {camper_id}: "
            f"FaceId={face_id}, confidence={confidence:.1f}%"
        )
        return face_id

    except ClientError as e:
        logger.error(f"Failed to index face for camper {camper_id}: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error indexing face for camper {camper_id}: {e}")
        raise


def search_faces_in_photo(
    organization_id,
    image_bytes: bytes,
    threshold: float = 80.0,
) -> List[Dict[str, Any]]:
    """
    Search for known camper faces in a photo.

    Calls Rekognition's search_faces_by_image to find matches in the
    organization's face collection.

    Args:
        organization_id: The organization UUID.
        image_bytes: Raw bytes of the photo to analyze.
        threshold: Minimum similarity threshold (0-100). Default 80.0.

    Returns:
        A list of match dicts, each containing:
            - camper_id: UUID string from ExternalImageId
            - face_id: The matched FaceId
            - similarity: Match similarity percentage
            - bounding_box: Dict with Width, Height, Left, Top
    """
    client = _get_rekognition_client()
    collection = _collection_id(organization_id)

    try:
        response = client.search_faces_by_image(
            CollectionId=collection,
            Image={"Bytes": image_bytes},
            FaceMatchThreshold=threshold,
            MaxFaces=20,
        )
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        if error_code == "InvalidParameterException":
            logger.warning(
                f"No face detected in photo for search "
                f"(org={organization_id})"
            )
            return []
        logger.error(f"Rekognition search_faces_by_image failed: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error searching faces: {e}")
        raise

    matches = []
    # Extract the searched face bounding box
    searched_face = response.get("SearchedFaceBoundingBox", {})

    for face_match in response.get("FaceMatches", []):
        matched_face = face_match.get("Face", {})
        similarity = face_match.get("Similarity", 0.0)
        external_id = matched_face.get("ExternalImageId", "")
        face_id = matched_face.get("FaceId", "")
        bounding_box = matched_face.get("BoundingBox", searched_face)

        matches.append({
            "camper_id": external_id,
            "face_id": face_id,
            "similarity": round(similarity, 2),
            "bounding_box": {
                "Width": bounding_box.get("Width", 0),
                "Height": bounding_box.get("Height", 0),
                "Left": bounding_box.get("Left", 0),
                "Top": bounding_box.get("Top", 0),
            },
        })

    logger.info(
        f"Found {len(matches)} face match(es) in photo "
        f"(org={organization_id}, threshold={threshold})"
    )
    return matches


def delete_faces_for_camper(
    organization_id,
    face_ids: List[str],
) -> None:
    """
    Delete face records from the organization's Rekognition collection.

    Called when a camper is removed or their reference photo changes.

    Args:
        organization_id: The organization UUID.
        face_ids: List of FaceId strings to remove.
    """
    if not face_ids:
        return

    client = _get_rekognition_client()
    collection = _collection_id(organization_id)

    try:
        response = client.delete_faces(
            CollectionId=collection,
            FaceIds=face_ids,
        )
        deleted = response.get("DeletedFaces", [])
        logger.info(
            f"Deleted {len(deleted)} face(s) from collection {collection}"
        )
    except ClientError as e:
        logger.error(
            f"Failed to delete faces from collection {collection}: {e}"
        )
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting faces: {e}")
        raise
