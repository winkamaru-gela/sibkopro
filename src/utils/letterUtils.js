import { formatIndoDate } from './helpers';

export const getKopSuratHTML = (settings) => {
    return `
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double black; padding-bottom: 10px; margin-bottom: 20px;">
        <div style="width: 80px; text-align: center;">
            ${settings?.logo ? `<img src="${settings.logo}" width="80" height="auto" />` : ''}
        </div>
        <div style="flex: 1; text-align: center; padding: 0 10px;">
            <h4 style="font-size: 12pt; margin: 0; text-transform: uppercase;">${settings?.government || 'PEMERINTAH PROVINSI ...'}</h4>
            <h4 style="font-size: 12pt; margin: 0; text-transform: uppercase;">${settings?.department || 'DINAS PENDIDIKAN'}</h4>
            <h2 style="font-size: 16pt; font-weight: bold; margin: 5px 0; text-transform: uppercase;">${settings?.name || 'NAMA SEKOLAH'}</h2>
            <p style="font-size: 9pt; margin: 0;">${settings?.address || 'Alamat Sekolah...'}</p>
        </div>
        <div style="width: 80px; text-align: center;">
            ${settings?.logo2 ? `<img src="${settings.logo2}" width="80" height="auto" />` : ''}
        </div>
    </div>
    `;
};

export const getTandaTanganHTML = (settings, user) => {
    return `
    <div style="margin-top: 30px; float: right; width: 220px; text-align: center;">
        <p>${settings?.city || '...'}, [TANGGAL_SEKARANG]</p>
        <p>Guru BK / Konselor</p>
        <br/><br/><br/><br/>
        <p style="font-weight: bold; text-decoration: underline;">${settings?.counselor || user?.fullName || '...'}</p>
        <p>NIP. ${settings?.nipCounselor || '-'}</p>
    </div>
    <div style="clear: both;"></div>
    `;
};

export const getViolationListHTML = (studentId, pointLogs, sanctionRules) => {
    const logs = (pointLogs || []).filter(log => log.studentId === studentId);
    
    const vTotal = logs.filter(l => l.type === 'violation').reduce((a, b) => a + parseInt(b.value || 0), 0);
    const aTotal = logs.filter(l => l.type === 'achievement').reduce((a, b) => a + parseInt(b.value || 0), 0);
    const netScore = vTotal - aTotal;

    const activeRule = (sanctionRules || [])
        .sort((a,b) => b.max - a.max) 
        .find(rule => netScore >= rule.min && netScore <= rule.max);
    
    const sanctionText = activeRule 
        ? `${activeRule.penalty || activeRule.action} (Kategori: ${activeRule.min}-${activeRule.max} Poin)` 
        : "Dalam Pembinaan";

    const violations = logs
        .filter(log => log.type === 'violation')
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (violations.length === 0) {
        return '<p style="font-style: italic; text-align: center;">- Tidak ada riwayat pelanggaran tercatat -</p>';
    }

    const rows = violations.map((v, index) => {
        let cleanDesc = v.description;
        if (v.code && v.description.startsWith(v.code)) {
            cleanDesc = v.description.replace(`${v.code} - `, '').replace(`${v.code}-`, '');
        }

        return `
        <tr>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${index + 1}</td>
            <td style="border: 1px solid black; padding: 4px;">${formatIndoDate(v.date)}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center; font-weight: bold;">${v.code || '-'}</td>
            <td style="border: 1px solid black; padding: 4px;">${cleanDesc || 'Pelanggaran Tanpa Ket.'}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${v.value}</td>
        </tr>
    `}).join('');

    return `
        <table style="width: 100%; border-collapse: collapse; margin-top: 5px; margin-bottom: 5px; font-size: 11pt;">
            <thead>
                <tr style="background-color: #f0f0f0;">
                    <th style="border: 1px solid black; padding: 4px; width: 5%;">No</th>
                    <th style="border: 1px solid black; padding: 4px; width: 15%;">Tanggal</th>
                    <th style="border: 1px solid black; padding: 4px; width: 10%;">Kode</th>
                    <th style="border: 1px solid black; padding: 4px; width: 55%;">Jenis Pelanggaran</th>
                    <th style="border: 1px solid black; padding: 4px; width: 15%;">Poin</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
                <tr style="background-color: #fafafa; font-weight: bold;">
                    <td colspan="4" style="border: 1px solid black; padding: 4px; text-align: right;">Total Akumulasi Poin :</td>
                    <td style="border: 1px solid black; padding: 4px; text-align: center;">${netScore}</td>
                </tr>
            </tbody>
        </table>
        <p style="margin-top: 5px;">Berdasarkan akumulasi poin di atas, siswa dikenakan sanksi: <strong>${sanctionText}</strong></p>
    `;
};