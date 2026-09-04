
// import iio và socket từ socket.io-client
// socket phía frontend 
import { io, Socket } from 'socket.io-client';

// biến này có thể chứa socket hoặc null
// ban đầu nó chưa có gì
let socket: Socket | null = null;

// tạo thuộc tính getSocket được export, 
export const getSocket = (): Socket => {
  // nếu không thấy socket 
  if (!socket) {
    // thì lấy url socket từ env hoặc local host mặc định
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    // đang ở browser window thì cấp token, nếu không thì khong cấp
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    // tạo socket client để chuẩn bị giao tiếp với backend
    socket = io(SOCKET_URL, {
      // đưa accesstoken vào thoongh tin xác thực khi kết nối socket 
      auth: { token },
      // có cho socket io tự động kết nối khi tạo socket không, 
      autoConnect: false,
    });
  }
  // socket đã được cấp thì return nó 
  return socket;
};

// đoạn này đảm bảo socket được cấu hình token và kết nối nếu chưa được kết nối 
// token ?: string là có thể truyền vào token cũng có thể không truyền
export const connectSocket = (token?: string) => {
  
  // lấy socket
  const s = getSocket();
  // nếu có token thì set auth = token 
  if (token) {
    s.auth = { token };
  }
  // nếu socket hiện tại chưa kết nối 
  if (!s.connected) {
    // thì kết nối, còn kết nối rồi thì thôinkk
    s.connect();
  }
  return s;
};

// ngắt kết nối tới socket 
export const disconnectSocket = () => {
  /// nếu có scoket thì disconnect nó và set socket thành null 
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
