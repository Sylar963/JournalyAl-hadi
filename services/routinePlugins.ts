import { checklistConfig } from '../components/Routine/Plugins/ChecklistPlugin';
import { correlationMatrixConfig } from '../components/Routine/Plugins/CorrelationMatrixPlugin';
import { dailyBiasConfig } from '../components/Routine/Plugins/DailyBiasPlugin';
import { RoutinePlugin } from '../types';
import { pluginRegistry } from './pluginRegistry';

let hasRegisteredRoutinePlugins = false;

export function registerRoutinePlugins(): void {
  if (hasRegisteredRoutinePlugins) {
    return;
  }

  pluginRegistry.register(correlationMatrixConfig);
  pluginRegistry.register(dailyBiasConfig);
  pluginRegistry.register(checklistConfig);
  hasRegisteredRoutinePlugins = true;
}

export function getRoutinePlugins(): RoutinePlugin[] {
  registerRoutinePlugins();
  return pluginRegistry.getAll();
}

export function getRoutinePlugin(id: string): RoutinePlugin | undefined {
  registerRoutinePlugins();
  return pluginRegistry.get(id);
}
