(async function() {
    console.log("%c[Khởi tạo] Đang nạp thư viện nén dữ liệu JSZip từ CDN...", "color: #00bcd4; font-weight: bold;");
    
    // 1. Nhúng thư viện JSZip vào trang web bằng code
    await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error("Không thể nạp thư viện JSZip."));
        document.head.appendChild(script);
    });

    console.log("%c[Thành công] Nạp thư viện thành công! Đang quét cấu trúc ảnh...", "color: #4caf50; font-weight: bold;");
    
    // 2. Lấy tất cả các thẻ img nằm trong danh sách viewer-list của bạn
    const imgElements = document.querySelectorAll('ul.viewer-list li img');
    if (imgElements.length === 0) {
        return console.error("Không tìm thấy danh sách ảnh. Hãy chắc chắn bạn đã mở bộ xem ảnh lên màn hình.");
    }

    // TỰ ĐỘNG LẤY TÊN TỪ URL VÀ CHUYỂN ĐỔI (ví dụ: lao-dong-ky-thuat-1-1993 -> Lao dong ky thuat 1 1993)
    const urlParts = window.location.pathname.split('/');
    let slug = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || "Bo_Suu_Tap_Anh";
    
    // Hàm biến đổi: Thay dấu gạch ngang thành dấu cách và Viết hoa chữ cái đầu tiên
    let zipFileName = slug
        .replace(/-/g, ' ') // Thay dấu gạch ngang thành khoảng trắng
        .replace(/\b\w/g, c => c.toUpperCase()) // Viết hoa chữ cái đầu của mỗi từ
        .trim();

    const zip = new JSZip();
    let downloadedCount = 0;

    console.log(`%c[Thông tin] Sách: "${zipFileName}". Tìm thấy ${imgElements.length} ảnh. Bắt đầu tải...`, "color: #ff9800;");

    // 3. Lặp qua từng ảnh để tải dữ liệu về bộ nhớ tạm và đưa vào file ZIP
    for (let i = 0; i < imgElements.length; i++) {
        const img = imgElements[i];
        const imgUrl = img.getAttribute('data-original-url') || img.src;
        
        // Đặt tên file ảnh bên trong file nén theo số thứ tự để gọn gàng (Trang_00.jpg, Trang_01.jpg...)
        const fileName = `Trang_${i.toString().padStart(2, '0')}.jpg`;

        try {
            const response = await fetch(imgUrl);
            if (!response.ok) throw new Error("Lỗi mạng không phản hồi");
            
            const blob = await response.blob();
            
            // Thêm file ảnh vào cấu trúc file ZIP
            zip.file(fileName, blob);
            downloadedCount++;
            console.log(`Tiến trình: [${downloadedCount}/${imgElements.length}] Đã nén ngầm: ${fileName}`);
        } catch (error) {
            console.warn(`⚠️ Bỏ qua ảnh thứ ${i} do lỗi tải:`, error.message);
        }

        // Chờ 150ms tránh làm nghẽn hoặc quá tải request lên server trang web
        await new Promise(resolve => setTimeout(resolve, 150));
    }

    if (downloadedCount === 0) {
        return console.error("Thất bại: Không tải được bức ảnh nào để đóng gói.");
    }

    // 4. Tiến hành đóng gói và kích hoạt nút download file ZIP về máy
    console.log(`%c[Nén File] Đang đóng gói dữ liệu thành file "${zipFileName}.zip"...`, "color: #00bcd4; font-weight: bold;");
    
    zip.generateAsync({ type: 'blob' }).then(function(content) {
        const blobUrl = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = blobUrl;
        
        // Đặt tên file nén tự động theo tên sách đã xử lý
        link.download = `${zipFileName}.zip`; 
        
        document.body.appendChild(link);
        link.click();
        
        // Giải phóng bộ nhớ tạm của trình duyệt
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        
        console.log(`%c🎉 HOÀN THÀNH: Đã tự động tải về file "${zipFileName}.zip" 🎉`, "color: #4caf50; font-size: 14px; font-weight: bold;");
    }).catch(err => {
        console.error("Gặp lỗi trong quá trình xuất file ZIP:", err);
    });
})();
