export function createSystemService({ systemRepository }) {
    return {
        async getAllSettingsFormatted() {
            try {
                const settingsArray = await systemRepository.getAllSettings();
                const settings = {
                    new_product_limit_minutes: 60,
                    auto_extend_trigger_minutes: 5,
                    auto_extend_duration_minutes: 10
                };
                
                if (settingsArray && settingsArray.length > 0) {
                    settingsArray.forEach(setting => {
                        settings[setting.key] = parseInt(setting.value);
                    });
                }
                return settings;
            } catch (error) {
                console.error("Service getAllSettings Error:", error);
                throw error;
            }
        },
        
        async updateSettings(data) {
            try {
                const { new_product_limit_minutes, auto_extend_trigger_minutes, auto_extend_duration_minutes } = data;
                await systemRepository.updateSetting('new_product_limit_minutes', new_product_limit_minutes);
                await systemRepository.updateSetting('auto_extend_trigger_minutes', auto_extend_trigger_minutes);
                await systemRepository.updateSetting('auto_extend_duration_minutes', auto_extend_duration_minutes);
            } catch (error) {
                console.error("Service updateSettings Error:", error);
                throw error;
            }
        }
    };
}
