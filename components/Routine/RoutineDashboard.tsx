import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { routineService } from '../../services/routineService';
import { pluginRegistry } from '../../services/pluginRegistry';
import RoutineWidget from './RoutineWidget';
import { correlationMatrixConfig } from './Plugins/CorrelationMatrixPlugin';
import { dailyBiasConfig } from './Plugins/DailyBiasPlugin';
import { checklistConfig } from './Plugins/ChecklistPlugin';
import { RoutineLayout, RoutinePlugin } from '../../types';

// Register plugins (normally done at app bootstrap)
pluginRegistry.register(correlationMatrixConfig);
pluginRegistry.register(dailyBiasConfig);
pluginRegistry.register(checklistConfig);

const RoutineDashboard: React.FC = () => {
    // Get today's layout
    const today = new Date().toISOString().split('T')[0];
    const [layout, setLayout] = useState<RoutineLayout | null>(null);
    const [activePlugins, setActivePlugins] = useState<RoutinePlugin[]>([]);

    useEffect(() => {
        const stored = routineService.getLayout(today);
        if (stored) {
            setLayout(stored);
            // Rehydrate plugins based on stored layout
            // For MVP version, we just show all registered plugins or default set
            setActivePlugins(pluginRegistry.getAll());
        } else {
            // Default setup for new day
            const defaultPlugins = pluginRegistry.getAll();
            setActivePlugins(defaultPlugins);
        }
    }, [today]);

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
                         <RoutineWidget title={plugin.title} icon={plugin.icon}>
                             <plugin.component 
                                data={{}} 
                                onUpdate={() => {}} 
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
                    <span className="text-sm font-medium">Add Widget</span>
                </span>
            </motion.button>
        </div>
    );
};

export default RoutineDashboard;
