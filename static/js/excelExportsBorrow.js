document.getElementById('exportBorrowsBtn').addEventListener('click', exportBorrowsToExcel);

async function exportBorrowsToExcel() {
    const res = await fetch('/api/borrow');
    const result = await res.json();

    if (result.error) {
        alert('Failed to fetch data.');
        return;
    }

    const data = result.data;

    if (!data || data.length === 0) {
        alert('No data to export.');
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Borrows');

    ws.columns = [
        { header: 'ID',              key: 'id',             width: 10 },
        { header: 'BOOK ID',         key: 'book_id',        width: 10 },
        { header: 'BOOK NAME',       key: 'book_name',      width: 32 },
        { header: 'BORROWER ID#',    key: 'student_lrn',    width: 16 },
        { header: 'BORROWER NAME',   key: 'student_name',   width: 24 },
        { header: 'BORROWER SCHOOL', key: 'student_school', width: 24 },
        { header: 'BORROW DATE',     key: 'borrow_date',    width: 16 },
        { header: 'DUE DATE',        key: 'due_date',       width: 16 },
        { header: 'RETURN DATE',     key: 'return_date',    width: 16 },
        { header: 'STATUS',          key: 'status',         width: 14 },
        { header: 'RENEWALS',        key: 'renewal_count',  width: 12 },
        { header: 'COPIES',          key: 'no_of_copies',   width: 10 },
        { header: 'REMARKS',         key: 'remarks',        width: 24 },
    ];

    // style header row
    const headerRow = ws.getRow(1);
    headerRow.height = 40;
    headerRow.eachCell(cell => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF217346' }  // excel green
        };
        cell.font = {
            bold: true,
            color: { argb: 'FFFFFFFF' },  // white text
            size: 11
        };
        cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: true
        };
        cell.border = {
            top:    { style: 'thin' },
            left:   { style: 'thin' },
            bottom: { style: 'thin' },
            right:  { style: 'thin' }
        };
    });

    // add data rows
    data.forEach(row => {
        ws.addRow({
            id:             row.id || '',
            book_id:        row.book_id || '',
            book_name:      bookMap?.[row.book_id] || '',
            student_lrn:    row.student_lrn || '',
            student_name:   row.student_name || '',
            student_school: row.student_school || '',
            borrow_date:    row.borrow_date || '',
            due_date:       row.due_date || '',
            return_date:    row.return_date || '',
            status:         row.status || '',
            renewal_count:  row.renewal_count || 0,
            no_of_copies:   row.no_of_copies || 0,
            remarks:        row.remarks || '',
        });
    });

    // download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `borrows_export_${today}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}