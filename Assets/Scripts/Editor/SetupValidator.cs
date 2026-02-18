#if UNITY_EDITOR
using System.Collections.Generic;
using NapoleonPrototype.AI;
using NapoleonPrototype.Core;
using NapoleonPrototype.Gameplay;
using NapoleonPrototype.Player;
using NapoleonPrototype.UI;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.AI;

namespace NapoleonPrototype.Editor
{
    public static class SetupValidator
    {
        [MenuItem("Tools/Napoleon MVP/Validate Setup")]
        public static void ValidateSetup()
        {
            List<string> errors = new();

            ValidateScene("Assets/Scenes/Scene_MainMenu.unity", scene =>
            {
                UIManager menuManager = Object.FindObjectOfType<UIManager>();
                if (menuManager == null)
                {
                    errors.Add("Scene_MainMenu: UIManager fehlt.");
                }

                if (Object.FindObjectOfType<Canvas>() == null)
                {
                    errors.Add("Scene_MainMenu: Canvas fehlt.");
                }

            }, errors);

            ValidateScene("Assets/Scenes/Scene_Mission1.unity", scene =>
            {
                if (Object.FindObjectOfType<GameManager>() == null)
                {
                    errors.Add("Scene_Mission1: GameManager fehlt.");
                }

                UIManager ui = Object.FindObjectOfType<UIManager>();
                if (ui == null)
                {
                    errors.Add("Scene_Mission1: UIManager fehlt.");
                }

                PlayerController player = Object.FindObjectOfType<PlayerController>();
                if (player == null)
                {
                    errors.Add("Scene_Mission1: PlayerController fehlt.");
                }

                ThirdPersonCamera cam = Object.FindObjectOfType<ThirdPersonCamera>();
                if (cam == null)
                {
                    errors.Add("Scene_Mission1: ThirdPersonCamera fehlt.");
                }

                SquadCommander commander = Object.FindObjectOfType<SquadCommander>();
                if (commander == null)
                {
                    errors.Add("Scene_Mission1: SquadCommander fehlt.");
                }

                UnitAI[] units = Object.FindObjectsOfType<UnitAI>();
                if (units.Length < 6)
                {
                    errors.Add($"Scene_Mission1: Erwartet >=6 Units, gefunden {units.Length}.");
                }

                foreach (UnitAI unit in units)
                {
                    if (unit.GetComponent<NavMeshAgent>() == null)
                    {
                        errors.Add($"Unit {unit.name}: NavMeshAgent fehlt.");
                    }

                    Health health = unit.GetComponent<Health>();
                    if (health == null)
                    {
                        errors.Add($"Unit {unit.name}: Health fehlt.");
                    }
                }

                CapturePoint[] points = Object.FindObjectsOfType<CapturePoint>();
                if (points.Length < 3)
                {
                    errors.Add($"Scene_Mission1: Erwartet >=3 CapturePoints, gefunden {points.Length}.");
                }

                foreach (CapturePoint point in points)
                {
                    SphereCollider col = point.GetComponent<SphereCollider>();
                    if (col == null || !col.isTrigger)
                    {
                        errors.Add($"CapturePoint {point.name}: SphereCollider als Trigger fehlt.");
                    }
                }
            }, errors);

            if (errors.Count == 0)
            {
                Debug.Log("Napoleon MVP Validate Setup: Alles OK ✅");
            }
            else
            {
                Debug.LogError("Napoleon MVP Validate Setup fehlgeschlagen:\n- " + string.Join("\n- ", errors));
            }
        }

        private static void ValidateScene(string path, System.Action<UnityEngine.SceneManagement.Scene> validateAction, List<string> errors)
        {
            var scene = EditorSceneManager.OpenScene(path, OpenSceneMode.Single);
            if (!scene.IsValid())
            {
                errors.Add($"Scene konnte nicht geöffnet werden: {path}");
                return;
            }

            validateAction(scene);
        }
    }
}
#endif
