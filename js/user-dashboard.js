document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth check
    const user = await SupabaseDB.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const sb = SupabaseDB.getClient();
    
    // UI elements
    const welcomeName = document.getElementById('welcome-name');
    if (user.user_metadata && user.user_metadata.full_name) {
        welcomeName.textContent = user.user_metadata.full_name;
    } else {
        welcomeName.textContent = user.email;
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await SupabaseDB.signOut();
            window.location.href = 'login.html';
        });
    }

    // Tab logic
    const tabs = document.querySelectorAll('.sidebar-nav a');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            if(tab.id === 'logout-btn') return;
            
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // 2. Fetch User Data
    async function fetchUserRiskAssessments() {
        const { data, error } = await sb
            .from('risk_assessments')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching risk assessments:', error);
            return;
        }

        const tbody = document.getElementById('risk-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        if(data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No risk assessments found.</td></tr>';
            return;
        }

        data.forEach(assessment => {
            const date = new Date(assessment.created_at).toLocaleDateString();
            const tr = document.createElement('tr');
            let riskLevel = assessment.risk_level || 'Unknown';
            let riskClass = 'status-pending';
            if (riskLevel.toLowerCase().includes('low')) riskClass = 'status-active';
            if (riskLevel.toLowerCase().includes('high')) riskClass = 'status-inactive';

            tr.innerHTML = `
                <td>${date}</td>
                <td>${assessment.age}</td>
                <td>${assessment.family_history ? 'Yes' : 'No'}</td>
                <td><span class="status-badge ${riskClass}">${riskLevel}</span></td>
                <td><button class="btn-sm" onclick="alert('View Details functionality coming soon')">View</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    async function fetchUserDonations() {
        const { data, error } = await sb
            .from('donations')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching donations:', error);
            return;
        }

        const tbody = document.getElementById('donation-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        if(data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No donations found.</td></tr>';
            return;
        }

        data.forEach(donation => {
            const date = new Date(donation.created_at).toLocaleDateString();
            const tr = document.createElement('tr');
            
            let statusClass = 'status-pending';
            if (donation.status === 'completed') statusClass = 'status-active';

            tr.innerHTML = `
                <td>${date}</td>
                <td>$${donation.amount}</td>
                <td><span class="status-badge ${statusClass}">${donation.status}</span></td>
                <td>Thank you!</td>
            `;
            tbody.appendChild(tr);
        });
    }

    async function fetchUserGroups() {
        const { data, error } = await sb
            .from('user_groups')
            .select('joined_at, community_groups(name, category)')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching groups:', error);
            return;
        }

        const tbody = document.getElementById('groups-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        if(data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">You haven\\'t joined any groups yet.</td></tr>';
            return;
        }

        data.forEach(record => {
            const group = record.community_groups;
            const date = new Date(record.joined_at).toLocaleDateString();
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${group.name}</td>
                <td>${group.category}</td>
                <td>${date}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Load initial data
    fetchUserRiskAssessments();
    fetchUserDonations();
    fetchUserGroups();

});
