using NapoleonPrototype.Core;
using NapoleonPrototype.Gameplay;
using UnityEngine;
using UnityEngine.AI;

namespace NapoleonPrototype.AI
{
    public enum UnitCommand
    {
        Auto,
        Attack,
        Retreat,
        Hold
    }

    /// <summary>
    /// Basic NavMesh FSM for infantry behavior.
    /// </summary>
    [RequireComponent(typeof(NavMeshAgent))]
    [RequireComponent(typeof(Health))]
    public class UnitAI : MonoBehaviour
    {
        [Header("Combat")]
        [SerializeField] private float detectionRange = 14f;
        [SerializeField] private float attackRange = 2.2f;
        [SerializeField] private float attackDamage = 20f;
        [SerializeField] private float attackCooldown = 1.2f;
        [SerializeField] private float lowHpRetreatThreshold = 25f;

        [Header("Movement")]
        [SerializeField] private Transform retreatPoint;

        private NavMeshAgent agent;
        private Health health;
        private UnitCommand currentCommand = UnitCommand.Auto;
        private float attackCooldownRemaining;
        private Health currentTarget;

        public Health Health => health;
        public UnitCommand CurrentCommand => currentCommand;

        private void Awake()
        {
            agent = GetComponent<NavMeshAgent>();
            health = GetComponent<Health>();
        }

        private void Update()
        {
            if (GameManager.Instance == null || GameManager.Instance.MissionEnded || !health.IsAlive)
            {
                return;
            }

            attackCooldownRemaining -= Time.deltaTime;

            if (health.CurrentHealth <= lowHpRetreatThreshold)
            {
                ExecuteRetreat();
                return;
            }

            switch (currentCommand)
            {
                case UnitCommand.Attack:
                    ExecuteAttackCommand();
                    break;
                case UnitCommand.Retreat:
                    ExecuteRetreat();
                    break;
                case UnitCommand.Hold:
                    ExecuteHold();
                    break;
                default:
                    ExecuteAuto();
                    break;
            }
        }

        public void SetCommand(UnitCommand command)
        {
            currentCommand = command;
        }

        public void SetRetreatPoint(Transform point)
        {
            retreatPoint = point;
        }

        private void ExecuteAuto()
        {
            Health enemy = FindClosestEnemyInRange(detectionRange);
            if (enemy != null)
            {
                EngageTarget(enemy);
                return;
            }

            CapturePoint targetPoint = GetHighestPriorityCapturePoint();
            if (targetPoint != null)
            {
                agent.isStopped = false;
                agent.SetDestination(targetPoint.transform.position);
            }
        }

        private void ExecuteAttackCommand()
        {
            Health enemy = FindClosestEnemyInRange(detectionRange * 1.5f);
            if (enemy != null)
            {
                EngageTarget(enemy);
                return;
            }

            CapturePoint point = GetHighestPriorityCapturePoint();
            if (point != null)
            {
                agent.isStopped = false;
                agent.SetDestination(point.transform.position);
            }
        }

        private void ExecuteRetreat()
        {
            if (retreatPoint == null)
            {
                return;
            }

            agent.isStopped = false;
            agent.SetDestination(retreatPoint.position);
        }

        private void ExecuteHold()
        {
            agent.isStopped = true;
            Health enemy = FindClosestEnemyInRange(detectionRange);
            if (enemy != null)
            {
                transform.LookAt(new Vector3(enemy.transform.position.x, transform.position.y, enemy.transform.position.z));
                TryAttack(enemy);
            }
        }

        private void EngageTarget(Health enemy)
        {
            currentTarget = enemy;
            float distance = Vector3.Distance(transform.position, enemy.transform.position);

            if (distance > attackRange)
            {
                agent.isStopped = false;
                agent.SetDestination(enemy.transform.position);
            }
            else
            {
                agent.isStopped = true;
                transform.LookAt(new Vector3(enemy.transform.position.x, transform.position.y, enemy.transform.position.z));
                TryAttack(enemy);
            }
        }

        private void TryAttack(Health enemy)
        {
            if (attackCooldownRemaining > 0f || enemy == null || !enemy.IsAlive)
            {
                return;
            }

            attackCooldownRemaining = attackCooldown;
            enemy.TakeDamage(attackDamage, health.team);
        }

        private Health FindClosestEnemyInRange(float range)
        {
            Collider[] hits = Physics.OverlapSphere(transform.position, range);
            Health closest = null;
            float closestDistance = float.MaxValue;

            foreach (Collider hit in hits)
            {
                Health candidate = hit.GetComponentInParent<Health>();
                if (candidate == null || candidate == health || !candidate.IsAlive)
                {
                    continue;
                }

                if (candidate.team == health.team || candidate.team == GameTeam.Neutral)
                {
                    continue;
                }

                float d = Vector3.Distance(transform.position, candidate.transform.position);
                if (d < closestDistance)
                {
                    closest = candidate;
                    closestDistance = d;
                }
            }

            return closest;
        }

        private CapturePoint GetHighestPriorityCapturePoint()
        {
            if (GameManager.Instance == null)
            {
                return null;
            }

            CapturePoint best = null;
            float bestScore = float.MinValue;

            foreach (CapturePoint point in GameManager.Instance.GetCapturePoints())
            {
                if (point == null)
                {
                    continue;
                }

                float distance = Vector3.Distance(transform.position, point.transform.position);
                float ownershipBias = point.Owner == health.team ? -30f : 30f;
                float score = ownershipBias - distance;

                if (score > bestScore)
                {
                    bestScore = score;
                    best = point;
                }
            }

            return best;
        }
    }
}
