export const mergeConfig = (target, source) => {
	const isObject = (value) => {
		return Boolean(value && typeof value === 'object' && !Array.isArray(value));
	};

	if (!isObject(target) || !isObject(source)) {
		return source;
	}

	const merged = { ...target };

	for (const key of Object.keys(source)) {
		const sourceValue = source[key];
		const targetValue = target[key];

		if (isObject(sourceValue) && isObject(targetValue)) {
			merged[key] = mergeConfig(targetValue, sourceValue);
		} else {
			merged[key] = sourceValue;
		}
	}

	return merged;
};
