using System;
using System.Collections.Generic;
using System.Linq;
using NapoleonPrototype.Core;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace NapoleonPrototype.Gameplay
{
    /// <summary>
    /// Mission-level orchestration: timer, score, win/lose conditions.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Mission Rules")]
        [SerializeField] private float missionDurationSeconds = 1800f;
        [SerializeField] private int scorePerPointPerSecond = 1;
        [SerializeField] private int killScore = 10;
        [SerializeField] private string mainMenuSceneName = "Scene_MainMenu";

        [Header("Runtime")]
        [SerializeField] private int blueScore;
        [SerializeField] private int redScore;

        private readonly List<CapturePoint> capturePoints = new();
        private readonly HashSet<Health> blueUnits = new();
        private readonly HashSet<Health> redUnits = new();

        private bool missionStarted;
        private bool missionEnded;
        private float timerRemaining;
        private float scoreTickAccumulator;

        public event Action<float> OnTimerChanged;
        public event Action<int, int> OnScoreChanged;
        public event Action<GameTeam, string> OnMissionEnded;

        public float TimerRemaining => timerRemaining;
        public int BlueScore => blueScore;
        public int RedScore => redScore;
        public bool MissionStarted => missionStarted;
        public bool MissionEnded => missionEnded;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            timerRemaining = missionDurationSeconds;
        }

        private void Update()
        {
            if (!missionStarted || missionEnded)
            {
                return;
            }

            timerRemaining = Mathf.Max(0f, timerRemaining - Time.deltaTime);
            OnTimerChanged?.Invoke(timerRemaining);

            scoreTickAccumulator += Time.deltaTime;
            while (scoreTickAccumulator >= 1f)
            {
                scoreTickAccumulator -= 1f;
                ApplyPointScoreTick();
            }

            if (timerRemaining <= 0f)
            {
                EndMissionByScore();
            }
        }

        public void StartMission()
        {
            missionStarted = true;
            missionEnded = false;
            timerRemaining = missionDurationSeconds;
            scoreTickAccumulator = 0f;
            blueScore = 0;
            redScore = 0;

            OnTimerChanged?.Invoke(timerRemaining);
            OnScoreChanged?.Invoke(blueScore, redScore);
        }

        public void RegisterCapturePoint(CapturePoint point)
        {
            if (!capturePoints.Contains(point))
            {
                capturePoints.Add(point);
            }
        }

        public void UnregisterCapturePoint(CapturePoint point)
        {
            capturePoints.Remove(point);
        }

        public IReadOnlyList<CapturePoint> GetCapturePoints()
        {
            return capturePoints;
        }

        public void RegisterUnit(Health health)
        {
            if (health == null)
            {
                return;
            }

            if (health.team == GameTeam.Blue)
            {
                blueUnits.Add(health);
            }
            else if (health.team == GameTeam.Red)
            {
                redUnits.Add(health);
            }
        }

        public void UnregisterUnit(Health health)
        {
            if (health == null)
            {
                return;
            }

            blueUnits.Remove(health);
            redUnits.Remove(health);
        }

        public void HandleUnitDeath(Health unit, GameTeam killerTeam)
        {
            if (missionEnded)
            {
                return;
            }

            if (killerTeam == GameTeam.Blue)
            {
                blueScore += killScore;
            }
            else if (killerTeam == GameTeam.Red)
            {
                redScore += killScore;
            }

            OnScoreChanged?.Invoke(blueScore, redScore);

            bool blueNapoleonDead = unit.team == GameTeam.Blue && unit.isNapoleon;
            bool redNapoleonDead = unit.team == GameTeam.Red && unit.isNapoleon;

            if (blueNapoleonDead || TeamWiped(GameTeam.Blue))
            {
                EndMission(GameTeam.Red, "Blue army eliminated");
                return;
            }

            if (redNapoleonDead || TeamWiped(GameTeam.Red))
            {
                EndMission(GameTeam.Blue, "Red army eliminated");
            }
        }

        public void ReturnToMainMenu()
        {
            SceneManager.LoadScene(mainMenuSceneName);
        }

        private bool TeamWiped(GameTeam team)
        {
            HashSet<Health> teamSet = team == GameTeam.Blue ? blueUnits : redUnits;
            return !teamSet.Any(u => u != null && u.IsAlive);
        }

        private void ApplyPointScoreTick()
        {
            foreach (CapturePoint point in capturePoints)
            {
                if (point == null)
                {
                    continue;
                }

                if (point.Owner == GameTeam.Blue)
                {
                    blueScore += scorePerPointPerSecond;
                }
                else if (point.Owner == GameTeam.Red)
                {
                    redScore += scorePerPointPerSecond;
                }
            }

            OnScoreChanged?.Invoke(blueScore, redScore);
        }

        private void EndMissionByScore()
        {
            if (blueScore == redScore)
            {
                EndMission(GameTeam.Blue, "Time up - draw resolved to Blue (attacker advantage)");
                return;
            }

            EndMission(blueScore > redScore ? GameTeam.Blue : GameTeam.Red, "Time up - score victory");
        }

        private void EndMission(GameTeam winner, string reason)
        {
            missionEnded = true;
            missionStarted = false;
            OnMissionEnded?.Invoke(winner, reason);
        }
    }
}
