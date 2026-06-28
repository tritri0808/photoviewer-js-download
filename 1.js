(async function() {
    console.log("Đang nạp thư viện nén dữ liệu JSZip...");
    
    // 1. Nhúng thư viện JSZip vào trang web bằng code
    await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error("Không thể nạp thư viện JSZip."));
        document.head.appendChild(script);
    });

    console.log("Nạp thư viện thành công! Bắt đầu quét ảnh...");
    
    // 2. Lấy tất cả các thẻ img nằm trong danh sách viewer-list của bạn
    const imgElements = document.querySelectorAll('ul.viewer-list li img');
    if (imgElements.length === 0) {
        return console.error("Không tìm thấy danh sách ảnh. Hãy chắc chắn bạn đã mở bộ xem ảnh.");
    }

    const zip = new JSZip();
    let downloadedCount = 0;

    console.log(`Tìm thấy ${imgElements.length} ảnh. Đang tiến hành tải ngầm và nén...`);

    // 3. Lặp qua từng ảnh để tải dữ liệu về bộ nhớ tạm và đưa vào file ZIP
    for (let i = 0; i < imgElements.length; i++) {
        const img = imgElements[i];
        const imgUrl = img.getAttribute('data-original-url') || img.src;
        
        // Đặt tên file ảnh bên trong file nén theo thẻ alt (ví dụ: Tiếng Việt 2... Trang 0.jpg)
        const altText = img.getAttribute('alt') || `Trang_${i}`;
        const fileName = altText.replace(/[/\\?%*:|"<>]/g, '-') + '.jpg';

        try {
            const response = await fetch(imgUrl);
            if (!response.ok) throw new Error("Lỗi mạng");
            
            const blob = await response.blob();
            
            // Thêm file ảnh vào cấu trúc file ZIP (tên file, dữ liệu ảnh)
            zip.file(fileName, blob);
            downloadedCount++;
            console.log(`[${downloadedCount}/${imgElements.length}] Đã thêm vào hàng đợi nén: ${fileName}`);
        } catch (error) {
            console.warn(`Bỏ qua ảnh thứ ${i} do lỗi:`, error.message);
        }

        // Chờ 150ms để tránh làm nghẽn băng thông trang web
        await new Promise(resolve => setTimeout(resolve, 150));
    }

    if (downloadedCount === 0) {
        return console.error("Không tải được bức ảnh nào để nén.");
    }

    // 4. Tiến hành đóng gói và tạo file ZIP
    console.log("Đang nén tất cả các file ảnh lại thành 1 file ZIP duy nhất (Quá trình này có thể mất vài giây)...");
    
    zip.generateAsync({ type: 'blob' }).then(function(content) {
        // Tạo link để tải file ZIP về máy
        const blobUrl = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = blobUrl;
        
        // Đặt tên cho file nén tải về máy
        link.download = 'Bo_Suu_Tap_Anh.zip'; 
        
        document.body.appendChild(link);
        link.click();
        
        // Giải phóng bộ nhớ
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        
        console.log("--- THÀNH CÔNG: Đã tải về file Bo_Suu_Tap_Anh.zip ---");
    }).catch(err => {
        console.error("Lỗi trong quá trình nén file ZIP:", err);
    });
})();
