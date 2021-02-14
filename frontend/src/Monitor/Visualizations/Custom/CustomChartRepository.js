import {capitalize} from 'Helpers';

let charts = {};
let loaded = false;

function checkLoaded() {
    if (!loaded) {
        const data = window.localStorage.getItem('customChartRepository');
        if (data) {
            charts = JSON.parse(data);
        }
        loaded = true;
    }
}

function getAllCharts() {
    checkLoaded();
    return Object.values(charts);
}

function getChart(name) {
    return charts[name];
}

function chartExists(name) {
    checkLoaded();
    return name.length > 0 && name in charts;
}

function addChart(chart) {
    // TODO - sync with chart repository. have chart repository hit getAllCharts?
    checkLoaded();
    charts[chart.name] = chart;
    window.localStorage.setItem('customChartRepository', JSON.stringify(charts));
}

function deleteChart(chart) {
    delete charts[chart.name];
}

function getSnapshotKeyBreakdown(object) {
    if (typeof object == 'number') return null;

    return Object.entries(object)
        .filter(([_, value]) => typeof value == 'object' || typeof value == 'number')
        .map(([key, value]) => {return {key: key, value: getSnapshotKeyBreakdown(value)}})
        .sort((left, right) => {
            if (left.key < right.key)
                return -1;
            if (right.key < left.key)
                return 1;
            return 0;
        });
}

const findDataKey = (list, key) => {
    for (const obj of list) {
        if (key === obj.key)
            return obj;
    }
    return null;
};

const combine = (existingList, newList) => {
    if (existingList == null || newList == null) return;

    newList.forEach(obj => {
        let existingObj = findDataKey(existingList, obj.key);
        if (existingObj == null) {
            existingList.push(obj);
        }
        else {
            combine(existingObj.value, obj.value);
        }
    })
};

function getSeriesKeyBreakdown(data) {
    let result = [];
    data.forEach(snap => {
        combine(result, getSnapshotKeyBreakdown(snap));
    });
    return result;
}

function getNextDataLevel(currentData, key) {
    if (key !== null)
        return findDataKey(currentData, key);
    let result = [];
    currentData.forEach(obj => {
        combine(result, obj.value);
    });
    if (result.length === 0 || result.includes(null))
        return null;
    return {
        key: key,
        value: result
    };
}

function makeLabelFromKey(key) {
    let adjKey = key.includes('_') ? capitalize(key, '_') : capitalize(key);
    if (adjKey === 'Energy')
        adjKey = 'Energy Credits';
    return adjKey;
}

export {
    getSeriesKeyBreakdown,
    findDataKey,
    getNextDataLevel,
    makeLabelFromKey,
    getAllCharts,
    getChart,
    chartExists,
    addChart,
    deleteChart
}
