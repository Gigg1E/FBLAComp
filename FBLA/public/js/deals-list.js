// Fetch and render list of active deals for public view
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializePage();
        loadDeals();
    } catch (err) {
        console.error('Error initializing deals page:', err);
    }
});

async function loadDeals() {
    try {
        const data = await apiCall('/api/deals?limit=50');
        const container = document.getElementById('deals-container');
        const noDeals = document.getElementById('no-deals');

        if (!data || !data.deals || data.deals.length === 0) {
            container.innerHTML = '';
            noDeals.style.display = 'block';
            return;
        }

        noDeals.style.display = 'none';

        container.innerHTML = data.deals.map(deal => `
            <div class="card deal-card" onclick="window.location.href='/business-detail.html?id=${deal.business_id}'">
                <div class="deal-card-header">
                    <div>
                        <p class="deal-business">${escapeHtml(deal.business_name || '')}</p>
                        <h3 class="deal-title">${escapeHtml(deal.title)}</h3>
                    </div>
                    <div class="deal-tag">${escapeHtml(deal.discount_amount || '')}</div>
                </div>
                <p class="text-secondary">${escapeHtml(deal.description || '')}</p>
                <p class="deal-dates text-sm">Valid until ${formatDate(deal.end_date)}</p>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error loading deals:', err);
        const container = document.getElementById('deals-container');
        container.innerHTML = '<div class="empty-state"><p>Failed to load deals.</p></div>';
    }
}

// Simple client-side escape to avoid injecting HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
