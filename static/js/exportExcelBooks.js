document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);

async function exportToExcel() {
    const data = originalData.filter(row => row.book_id);

    if (!data || data.length === 0) {
        alert('No data to export.');
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Books');

    // column definitions with widths
    ws.columns = [
        { header: 'ACCESSION NUMBER',          key: 'accession',       width: 20 },
        { header: 'TITLE',                      key: 'title',           width: 32 },
        { header: 'PUBLICATION/ COPYRIGHT DATE',key: 'year',            width: 16 },
        { header: 'SLR TYPE',                   key: 'slr_type',        width: 22 },
        { header: 'AUTHOR',                     key: 'author',          width: 22 },
        { header: 'ILUSTRATOR',                 key: 'illustrator',     width: 22 },
        { header: 'KEY STAGE/ GRADE LEVEL',     key: 'grade_level',     width: 28 },
        { header: 'QUANTITY',                   key: 'quantity',        width: 12 },
        { header: 'PUBLISHER',                  key: 'publisher',       width: 22 },
        { header: 'NUMBER OF PAGES',            key: 'pages',           width: 14 },
        { header: 'ISBN',                       key: 'isbn',            width: 22 },
        { header: 'BOOK ID',                    key: 'book_id',         width: 10 },
        { header: 'AVAILABLE COPIES',           key: 'available',       width: 14 },
        { header: 'SHELF LOCATION',             key: 'shelf',           width: 16 },
        { header: 'CREATED AT',                 key: 'created_at',      width: 16 },
        { header: 'LAST UPDATED AT',            key: 'last_updated_at', width: 16 },
    ];

    // style header row
    const headerRow = ws.getRow(1);
    headerRow.height = 40;
    headerRow.eachCell(cell => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFD700' }  // yellow
        };
        cell.font = {
            bold: true,
            color: { argb: 'FF000000' },
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
        const start = String(row.accession_no_start || 0).padStart(6, '0');
        const end = String(row.accession_no_end || 0).padStart(6, '0');

        ws.addRow({
            accession:       `${start}-${end}`,
            title:           row.title || '',
            year:            row.publication_year || '',
            slr_type:        window.genreMap?.[Number(row.category_id)] || '',
            author:          row.author || '',
            illustrator:     row.illustrator || '',
            grade_level:     row.key_stage_grade_level || '',
            quantity:        row.total_copies || '',
            publisher:       row.publisher || '',
            pages:           row.no_of_pages || '',
            isbn:            row.isbn || '',
            book_id:         row.book_id || '',
            available:       row.available_copies || '',
            shelf:           row.shelf_location || '',
            created_at:      row.created_at || '',
            last_updated_at: row.last_updated_at || '',
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
    a.download = `books_export_${today}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}