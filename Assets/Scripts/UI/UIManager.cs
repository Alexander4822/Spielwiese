using System.Text;
using NapoleonPrototype.Core;
using NapoleonPrototype.Gameplay;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace NapoleonPrototype.UI
{
    /// <summary>
    /// Handles main menu flow, mission intro overlay, and in-game HUD.
    /// </summary>
    public class UIManager : MonoBehaviour
    {
        [Header("Scene Names")]
        [SerializeField] private string missionSceneName = "Scene_Mission1";

        [Header("Main Menu")]
        [SerializeField] private GameObject mainMenuRoot;

        [Header("Mission Intro")]
        [SerializeField] private GameObject introOverlayRoot;
        [SerializeField] private TMP_Text introText;

        [Header("HUD")]
        [SerializeField] private GameObject hudRoot;
        [SerializeField] private TMP_Text timerText;
        [SerializeField] private TMP_Text scoreText;
        [SerializeField] private TMP_Text pointStatusText;
        [SerializeField] private TMP_Text playerHpText;

        [Header("End Screen")]
        [SerializeField] private GameObject endPanel;
        [SerializeField] private TMP_Text endText;

        [Header("Refs")]
        [SerializeField] private Health playerHealth;

        private void Start()
        {
            string currentScene = SceneManager.GetActiveScene().name;
            bool inMenu = currentScene == "Scene_MainMenu";
            SetupRoots(inMenu);

            if (inMenu)
            {
                return;
            }

            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnTimerChanged += UpdateTimer;
                GameManager.Instance.OnScoreChanged += UpdateScore;
                GameManager.Instance.OnMissionEnded += OnMissionEnded;
            }

            if (playerHealth != null)
            {
                playerHealth.OnHealthChanged += UpdatePlayerHp;
                UpdatePlayerHp(playerHealth.CurrentHealth, playerHealth.MaxHealth);
            }

            if (introText != null)
            {
                introText.text =
                    "M1: Erobere Punkte, besiege die gegnerische Armee oder führe nach Ablauf der Zeit.\n" +
                    "Steuerung: WASD Bewegen, Shift Sprint, Space Sprung, LMB Nahkampf, RMB Schuss\n" +
                    "Befehle: [1] Angriff  [2] Rückzug  [3] Halten\n\n" +
                    "Drücke Enter um zu beginnen.";
            }

            if (hudRoot != null)
            {
                hudRoot.SetActive(false);
            }
        }

        private void Update()
        {
            string currentScene = SceneManager.GetActiveScene().name;
            if (currentScene != missionSceneName)
            {
                return;
            }

            if (introOverlayRoot != null && introOverlayRoot.activeSelf && Input.GetKeyDown(KeyCode.Return))
            {
                introOverlayRoot.SetActive(false);
                if (hudRoot != null)
                {
                    hudRoot.SetActive(true);
                }
                GameManager.Instance?.StartMission();
            }

            UpdatePointStatus();
        }

        private void OnDestroy()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnTimerChanged -= UpdateTimer;
                GameManager.Instance.OnScoreChanged -= UpdateScore;
                GameManager.Instance.OnMissionEnded -= OnMissionEnded;
            }

            if (playerHealth != null)
            {
                playerHealth.OnHealthChanged -= UpdatePlayerHp;
            }
        }

        public void OnStartMissionPressed()
        {
            SceneManager.LoadScene(missionSceneName);
        }

        public void OnQuitPressed()
        {
            Application.Quit();
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#endif
        }

        public void OnReturnToMenuPressed()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.ReturnToMainMenu();
            }
            else
            {
                SceneManager.LoadScene("Scene_MainMenu");
            }
        }

        private void SetupRoots(bool inMenu)
        {
            if (mainMenuRoot != null)
            {
                mainMenuRoot.SetActive(inMenu);
            }

            if (introOverlayRoot != null)
            {
                introOverlayRoot.SetActive(!inMenu);
            }

            if (hudRoot != null)
            {
                hudRoot.SetActive(false);
            }

            if (endPanel != null)
            {
                endPanel.SetActive(false);
            }
        }

        private void UpdateTimer(float timeRemaining)
        {
            if (timerText == null)
            {
                return;
            }

            int minutes = Mathf.FloorToInt(timeRemaining / 60f);
            int seconds = Mathf.FloorToInt(timeRemaining % 60f);
            timerText.text = $"Zeit: {minutes:00}:{seconds:00}";
        }

        private void UpdateScore(int blue, int red)
        {
            if (scoreText != null)
            {
                scoreText.text = $"Blau {blue} : {red} Rot";
            }
        }

        private void UpdatePlayerHp(float current, float max)
        {
            if (playerHpText != null)
            {
                playerHpText.text = $"Napoleon HP: {Mathf.CeilToInt(current)}/{Mathf.CeilToInt(max)}";
            }
        }

        private void UpdatePointStatus()
        {
            if (pointStatusText == null || GameManager.Instance == null)
            {
                return;
            }

            StringBuilder sb = new();
            foreach (CapturePoint point in GameManager.Instance.GetCapturePoints())
            {
                if (point == null)
                {
                    continue;
                }

                char ownerChar = point.Owner switch
                {
                    GameTeam.Blue => 'B',
                    GameTeam.Red => 'R',
                    _ => 'N'
                };

                sb.Append(point.PointId).Append(':').Append(ownerChar).Append("  ");
            }

            pointStatusText.text = sb.ToString();
        }

        private void OnMissionEnded(GameTeam winner, string reason)
        {
            if (endPanel != null)
            {
                endPanel.SetActive(true);
            }

            if (endText != null)
            {
                endText.text = $"{winner} gewinnt!\n{reason}\n\nDrücke den Menü-Button.";
            }
        }
    }
}
