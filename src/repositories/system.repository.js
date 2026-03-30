export function createSystemRepository(systemSettingModel) {
    return {
        getAllSettings: () => systemSettingModel.getAllSettings(),
        updateSetting: (key, value) => systemSettingModel.updateSetting(key, value)
    };
}
