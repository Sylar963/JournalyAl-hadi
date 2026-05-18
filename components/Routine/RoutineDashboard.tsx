import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { routineService } from '../../services/routineService';
import { getRoutinePlugin, getRoutinePlugins } from '../../services/routinePlugins';
import RoutineWidget from './RoutineWidget';
import { BiasDirection, RoutineLayout, RoutinePlugin, WidgetData } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { TranslationKey } from '../../utils/translations';

const createDefaultLayout = (plugins: RoutinePlugin[]): RoutineLayout => ({
    items: plugins.map((plugin, index) => ({
        i: plugin.id,
        x: index % 3,
        y: Math.floor(index / 3),
        w: plugin.defaultSize.w,
        h: plugin.defaultSize.h,
        pluginId: plugin.id,
        data: {},
    })),
    thesis: null,
    lastUpdated: new Date().toISOString(),
});

const RoutineDashboard: React.FC = () => {
    const { t } = useI18n();
    // Get today's layout
    const today = new Date().toISOString().split('T')[0];
    const [layout, setLayout] = useState<RoutineLayout | null>(null);
    const activePlugins = useMemo(() => getRoutinePlugins(), []);

    useEffect(() => {
        const stored = routineService.getLayout(today);
        if (stored) {
            setLayout(stored);
            return;
        }

        const defaultLayout = routineService.getLastKnownLayout() ?? createDefaultLayout(activePlugins);
        setLayout(defaultLayout);
        routineService.saveLayout(today, defaultLayout);
        routineService.saveTemplate(defaultLayout);
    }, [activePlugins, today]);

    const handlePluginUpdate = (pluginId: string, data: WidgetData) => {
        setLayout((currentLayout) => {
            const baseLayout = currentLayout ?? createDefaultLayout(activePlugins);
            const plugin = getRoutinePlugin(pluginId);
            const existingItem = baseLayout.items.find((item) => item.pluginId === pluginId);
            const items = existingItem
                ? baseLayout.items.map((item) => (
                    item.pluginId === pluginId
                        ? { ...item, data: { ...item.data, ...data } }
                        : item
                ))
                : [
                    ...baseLayout.items,
                    {
                        i: pluginId,
                        x: 0,
                        y: baseLayout.items.length,
                        w: plugin?.defaultSize.w ?? 1,
                        h: plugin?.defaultSize.h ?? 1,
                        pluginId,
                        data,
                    },
                ];
            const nextLayout = {
                ...baseLayout,
                items,
                thesis: pluginId === 'daily-bias' && typeof data.bias === 'string'
                    ? data.bias as BiasDirection
                    : baseLayout.thesis,
                lastUpdated: new Date().toISOString(),
            };

            routineService.saveLayout(today, nextLayout);
            routineService.saveTemplate(nextLayout);
            return nextLayout;
        });
    };

    // Simple Grid for MVP
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
            <AnimatePresence>
                {activePlugins.map((plugin) => (
                    <motion.div
                        key={plugin.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        layout
                        className=""
                    >
                         <RoutineWidget title={t(plugin.title as TranslationKey)} icon={plugin.icon}>
                             <plugin.component 
                                data={layout?.items.find((item) => item.pluginId === plugin.id)?.data ?? {}} 
                                onUpdate={(data) => handlePluginUpdate(plugin.id, data)} 
                             />
                         </RoutineWidget>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* "Add Widget" Placeholder */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center p-6 text-gray-500 hover:text-white hover:border-white/30 transition-all min-h-[200px]"
            >
                <span className="flex flex-col items-center">
                    <span className="text-3xl mb-2">+</span>
                    <span className="text-sm font-medium">{t('routine.add_widget')}</span>
                </span>
            </motion.button>
        </div>
    );
};

export default RoutineDashboard;
