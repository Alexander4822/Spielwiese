using System.Collections.Generic;
using NapoleonPrototype.Gameplay;
using UnityEngine;

namespace NapoleonPrototype.AI
{
    /// <summary>
    /// Player tactical orders for linked squads.
    /// 1 = Attack, 2 = Retreat, 3 = Hold.
    /// </summary>
    public class SquadCommander : MonoBehaviour
    {
        [SerializeField] private List<UnitAI> controlledUnits = new();
        [SerializeField] private Transform retreatPoint;

        private void Start()
        {
            foreach (UnitAI unit in controlledUnits)
            {
                if (unit != null)
                {
                    unit.SetRetreatPoint(retreatPoint);
                }
            }
        }

        private void Update()
        {
            if (GameManager.Instance == null || !GameManager.Instance.MissionStarted || GameManager.Instance.MissionEnded)
            {
                return;
            }

            if (Input.GetKeyDown(KeyCode.Alpha1))
            {
                BroadcastCommand(UnitCommand.Attack);
            }
            else if (Input.GetKeyDown(KeyCode.Alpha2))
            {
                BroadcastCommand(UnitCommand.Retreat);
            }
            else if (Input.GetKeyDown(KeyCode.Alpha3))
            {
                BroadcastCommand(UnitCommand.Hold);
            }
        }

        public void BroadcastCommand(UnitCommand command)
        {
            foreach (UnitAI unit in controlledUnits)
            {
                if (unit != null)
                {
                    unit.SetCommand(command);
                }
            }
        }
    }
}
