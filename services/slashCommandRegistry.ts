export interface SlashCommand {
  name: string;
  description: string;
  usage: string;
  execute: (args: string[]) => Promise<void> | void;
}

class SlashCommandRegistryImpl {
  private commands: Map<string, SlashCommand> = new Map();

  register(command: SlashCommand): void {
    if (this.commands.has(command.name)) {
      console.warn(`Command /${command.name} already registered, overwriting`);
    }
    this.commands.set(command.name, command);
  }

  unregister(name: string): boolean {
    return this.commands.delete(name);
  }

  get(name: string): SlashCommand | undefined {
    return this.commands.get(name);
  }

  getAll(): SlashCommand[] {
    return Array.from(this.commands.values());
  }

  getByPrefix(prefix: string): SlashCommand[] {
    const lowerPrefix = prefix.toLowerCase();
    return this.getAll().filter(cmd => cmd.name.startsWith(lowerPrefix));
  }
}

export const SlashCommandRegistry = new SlashCommandRegistryImpl();