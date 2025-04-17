// js/account-service.js
const API_BASE = 'http://localhost:5000';

export async function getAccountInfo(token) {
    const response = await fetch(`${API_BASE}/account`, {
        headers: { Authorization: token }
    });
    return await response.json();
}

export async function getUserCampaigns(token) {
    const response = await fetch(`${API_BASE}/campaigns`, {
        headers: { Authorization: token }
    });
    return await response.json();
}

export async function saveCampaign(token, campaignData) {
    const response = await fetch(`${API_BASE}/campaigns`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify(campaignData)
    });
    return await response.json();
}