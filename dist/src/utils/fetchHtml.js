"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchHTML = void 0;
async function fetchHTML(url) {
    try {
        const response = await fetch(url);
        return await response.text();
    }
    catch (error) {
        throw new Error(`Error fetching HTML`);
    }
}
exports.fetchHTML = fetchHTML;
