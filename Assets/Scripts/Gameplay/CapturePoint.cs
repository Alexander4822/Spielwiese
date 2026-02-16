using System.Collections.Generic;
using NapoleonPrototype.Core;
using UnityEngine;

namespace NapoleonPrototype.Gameplay
{
    /// <summary>
    /// Capture logic for control points A/B/C.
    /// Add a SphereCollider (isTrigger=true) that matches capture radius.
    /// </summary>
    [RequireComponent(typeof(SphereCollider))]
    public class CapturePoint : MonoBehaviour
    {
        [SerializeField] private string pointId = "A";
        [SerializeField] private GameTeam owner = GameTeam.Neutral;
        [SerializeField] private float captureDuration = 10f;
        [SerializeField] private Renderer flagRenderer;

        private readonly HashSet<Health> blueInside = new();
        private readonly HashSet<Health> redInside = new();

        private float progress;

        public string PointId => pointId;
        public GameTeam Owner => owner;
        public float NormalizedProgress => Mathf.Clamp01(progress / captureDuration);

        private void OnEnable()
        {
            GameManager.Instance?.RegisterCapturePoint(this);
            UpdateVisual();
        }

        private void OnDisable()
        {
            GameManager.Instance?.UnregisterCapturePoint(this);
        }

        private void Update()
        {
            TickCapture(Time.deltaTime);
        }

        private void TickCapture(float deltaTime)
        {
            RemoveDeadEntries();

            int blueCount = blueInside.Count;
            int redCount = redInside.Count;

            if (blueCount == redCount)
            {
                return;
            }

            GameTeam strongerSide = blueCount > redCount ? GameTeam.Blue : GameTeam.Red;
            float direction = strongerSide == GameTeam.Blue ? 1f : -1f;
            progress += direction * deltaTime;
            progress = Mathf.Clamp(progress, -captureDuration, captureDuration);

            if (progress >= captureDuration)
            {
                SetOwner(GameTeam.Blue);
                progress = captureDuration;
            }
            else if (progress <= -captureDuration)
            {
                SetOwner(GameTeam.Red);
                progress = -captureDuration;
            }
        }

        private void SetOwner(GameTeam newOwner)
        {
            if (owner == newOwner)
            {
                return;
            }

            owner = newOwner;
            UpdateVisual();
        }

        private void UpdateVisual()
        {
            if (flagRenderer == null)
            {
                return;
            }

            Color color = owner switch
            {
                GameTeam.Blue => Color.blue,
                GameTeam.Red => Color.red,
                _ => Color.gray
            };

            flagRenderer.material.color = color;
        }

        private void OnTriggerEnter(Collider other)
        {
            Health health = other.GetComponentInParent<Health>();
            if (health == null)
            {
                return;
            }

            if (health.team == GameTeam.Blue)
            {
                blueInside.Add(health);
            }
            else if (health.team == GameTeam.Red)
            {
                redInside.Add(health);
            }
        }

        private void OnTriggerExit(Collider other)
        {
            Health health = other.GetComponentInParent<Health>();
            if (health == null)
            {
                return;
            }

            blueInside.Remove(health);
            redInside.Remove(health);
        }

        private void RemoveDeadEntries()
        {
            blueInside.RemoveWhere(h => h == null || !h.IsAlive);
            redInside.RemoveWhere(h => h == null || !h.IsAlive);
        }
    }
}
