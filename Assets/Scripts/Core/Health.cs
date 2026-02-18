using System;
using NapoleonPrototype.Core;
using NapoleonPrototype.Gameplay;
using UnityEngine;

namespace NapoleonPrototype.Core
{
    /// <summary>
    /// Generic health component for player and AI units.
    /// </summary>
    public class Health : MonoBehaviour
    {
        [Header("Identity")]
        public GameTeam team = GameTeam.Neutral;
        public bool isNapoleon;

        [Header("Stats")]
        [SerializeField] private float maxHealth = 100f;
        [SerializeField] private float currentHealth = 100f;

        public event Action<float, float> OnHealthChanged;
        public event Action<Health, GameTeam> OnDied;

        public float CurrentHealth => currentHealth;
        public float MaxHealth => maxHealth;
        public bool IsAlive => currentHealth > 0f;

        private void Awake()
        {
            currentHealth = Mathf.Clamp(currentHealth, 1f, maxHealth);
        }

        private void OnEnable()
        {
            GameManager.Instance?.RegisterUnit(this);
        }

        private void OnDisable()
        {
            GameManager.Instance?.UnregisterUnit(this);
        }

        public void SetFullHealth()
        {
            currentHealth = maxHealth;
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
        }

        public void TakeDamage(float amount, GameTeam sourceTeam)
        {
            if (!IsAlive || amount <= 0f)
            {
                return;
            }

            currentHealth = Mathf.Max(0f, currentHealth - amount);
            OnHealthChanged?.Invoke(currentHealth, maxHealth);

            if (currentHealth <= 0f)
            {
                Die(sourceTeam);
            }
        }

        private void Die(GameTeam killerTeam)
        {
            OnDied?.Invoke(this, killerTeam);
            GameManager.Instance?.HandleUnitDeath(this, killerTeam);
            Destroy(gameObject);
        }
    }
}
