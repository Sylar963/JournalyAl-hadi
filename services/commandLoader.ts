import { SlashCommandRegistry } from './slashCommandRegistry';

const registerCodepatternsCommand = () => {
  SlashCommandRegistry.register({
    name: 'codepatterns',
    description: 'Search and display code patterns from your project',
    usage: '/codepatterns [query]',
    execute: async (args) => {
      const query = args.join(' ');
      console.log('Searching patterns for:', query);
    },
  });
};

const registerGotoCommand = () => {
  SlashCommandRegistry.register({
    name: 'goto',
    description: 'Navigate to a view or screen',
    usage: '/goto [view]',
    execute: async (args) => {
      const view = args[0];
      console.log('Navigate to:', view);
    },
  });
};

const registerExportCommand = () => {
  SlashCommandRegistry.register({
    name: 'export',
    description: 'Export journal data',
    usage: '/export [json|csv]',
    execute: async (args) => {
      const format = args[0] || 'json';
      console.log('Export as:', format);
    },
  });
};

const registerThemeCommand = () => {
  SlashCommandRegistry.register({
    name: 'theme',
    description: 'Change the app theme',
    usage: '/theme [twilight|ocean|forest|sunset]',
    execute: async (args) => {
      const themeName = args[0];
      console.log('Set theme:', themeName);
    },
  });
};

const registerHelpCommand = () => {
  SlashCommandRegistry.register({
    name: 'help',
    description: 'Show all available commands',
    usage: '/help',
    execute: async () => {
      const commands = SlashCommandRegistry.getAll();
      console.log('Available commands:');
      commands.forEach((cmd) => {
        console.log(`  /${cmd.name} - ${cmd.description}`);
      });
    },
  });
};

export const registerAllCommands = () => {
  registerCodepatternsCommand();
  registerGotoCommand();
  registerExportCommand();
  registerThemeCommand();
  registerHelpCommand();
};