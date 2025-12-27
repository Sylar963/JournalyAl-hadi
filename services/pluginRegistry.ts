import { RoutinePlugin } from '../types';

class PluginRegistry {
  private plugins: Map<string, RoutinePlugin> = new Map();

  register(plugin: RoutinePlugin) {
    this.plugins.set(plugin.id, plugin);
  }

  get(id: string): RoutinePlugin | undefined {
    return this.plugins.get(id);
  }

  getAll(): RoutinePlugin[] {
    return Array.from(this.plugins.values());
  }
}

export const pluginRegistry = new PluginRegistry();
