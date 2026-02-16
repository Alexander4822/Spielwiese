using UnityEngine;

namespace NapoleonPrototype.Player
{
    /// <summary>
    /// Simple orbit follow camera with obstruction avoidance.
    /// </summary>
    public class ThirdPersonCamera : MonoBehaviour
    {
        [SerializeField] private Transform target;
        [SerializeField] private Vector3 pivotOffset = new(0f, 1.7f, 0f);
        [SerializeField] private float distance = 6f;
        [SerializeField] private float minPitch = -20f;
        [SerializeField] private float maxPitch = 65f;
        [SerializeField] private float yawSpeed = 140f;
        [SerializeField] private float pitchSpeed = 120f;
        [SerializeField] private float smooth = 12f;
        [SerializeField] private LayerMask obstructionMask = ~0;

        private float yaw;
        private float pitch = 15f;

        private void LateUpdate()
        {
            if (target == null)
            {
                return;
            }

            yaw += Input.GetAxis("Mouse X") * yawSpeed * Time.deltaTime;
            pitch -= Input.GetAxis("Mouse Y") * pitchSpeed * Time.deltaTime;
            pitch = Mathf.Clamp(pitch, minPitch, maxPitch);

            Vector3 pivot = target.position + pivotOffset;
            Quaternion rotation = Quaternion.Euler(pitch, yaw, 0f);
            Vector3 desiredOffset = rotation * new Vector3(0f, 0f, -distance);
            Vector3 desiredPosition = pivot + desiredOffset;

            if (Physics.Linecast(pivot, desiredPosition, out RaycastHit hit, obstructionMask))
            {
                desiredPosition = hit.point + hit.normal * 0.2f;
            }

            transform.position = Vector3.Lerp(transform.position, desiredPosition, smooth * Time.deltaTime);
            transform.rotation = Quaternion.Lerp(transform.rotation, rotation, smooth * Time.deltaTime);
        }

        public void SetTarget(Transform newTarget)
        {
            target = newTarget;
        }
    }
}
