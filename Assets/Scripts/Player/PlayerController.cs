using NapoleonPrototype.Core;
using NapoleonPrototype.Gameplay;
using UnityEngine;

namespace NapoleonPrototype.Player
{
    /// <summary>
    /// Third-person player controller with melee + ranged placeholder combat.
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    [RequireComponent(typeof(Health))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement")]
        [SerializeField] private float walkSpeed = 5f;
        [SerializeField] private float sprintSpeed = 8f;
        [SerializeField] private float rotationSpeed = 10f;
        [SerializeField] private float jumpHeight = 1.2f;
        [SerializeField] private float gravity = -20f;

        [Header("Combat")]
        [SerializeField] private float meleeRange = 2.25f;
        [SerializeField] private float meleeDamage = 35f;
        [SerializeField] private float rangedRange = 20f;
        [SerializeField] private float rangedDamage = 25f;
        [SerializeField] private LayerMask hitMask = ~0;

        private CharacterController controller;
        private Health health;

        private Vector3 velocity;
        private Camera mainCamera;

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            health = GetComponent<Health>();
            mainCamera = Camera.main;
        }

        private void Start()
        {
            if (health.team == GameTeam.Neutral)
            {
                health.team = GameTeam.Blue;
            }
        }

        private void Update()
        {
            if (GameManager.Instance == null || !GameManager.Instance.MissionStarted || GameManager.Instance.MissionEnded || !health.IsAlive)
            {
                return;
            }

            HandleMovement();
            HandleCombat();
        }

        private void HandleMovement()
        {
            float horizontal = Input.GetAxis("Horizontal");
            float vertical = Input.GetAxis("Vertical");
            Vector3 input = new Vector3(horizontal, 0f, vertical);

            Vector3 moveDirection = Vector3.zero;
            if (input.sqrMagnitude > 0.01f && mainCamera != null)
            {
                Vector3 camForward = mainCamera.transform.forward;
                Vector3 camRight = mainCamera.transform.right;
                camForward.y = 0f;
                camRight.y = 0f;
                camForward.Normalize();
                camRight.Normalize();

                moveDirection = camForward * input.z + camRight * input.x;
                moveDirection.Normalize();

                Quaternion targetRotation = Quaternion.LookRotation(moveDirection);
                transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, rotationSpeed * Time.deltaTime);
            }

            float speed = Input.GetKey(KeyCode.LeftShift) ? sprintSpeed : walkSpeed;
            controller.Move(moveDirection * (speed * Time.deltaTime));

            if (controller.isGrounded && velocity.y < 0f)
            {
                velocity.y = -2f;
            }

            if (controller.isGrounded && Input.GetKeyDown(KeyCode.Space))
            {
                velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
            }

            velocity.y += gravity * Time.deltaTime;
            controller.Move(velocity * Time.deltaTime);
        }

        private void HandleCombat()
        {
            if (Input.GetMouseButtonDown(0))
            {
                TryMeleeAttack();
            }

            if (Input.GetMouseButtonDown(1))
            {
                TryRangedAttack();
            }
        }

        private void TryMeleeAttack()
        {
            Collider[] hits = Physics.OverlapSphere(transform.position + transform.forward, meleeRange, hitMask);
            foreach (Collider hit in hits)
            {
                Health target = hit.GetComponentInParent<Health>();
                if (target == null || target.team == health.team || !target.IsAlive)
                {
                    continue;
                }

                target.TakeDamage(meleeDamage, health.team);
                break;
            }
        }

        private void TryRangedAttack()
        {
            if (mainCamera == null)
            {
                return;
            }

            Ray ray = new Ray(mainCamera.transform.position, mainCamera.transform.forward);
            if (Physics.Raycast(ray, out RaycastHit hit, rangedRange, hitMask))
            {
                Health target = hit.collider.GetComponentInParent<Health>();
                if (target != null && target.team != health.team && target.IsAlive)
                {
                    target.TakeDamage(rangedDamage, health.team);
                }
            }
        }
    }
}
