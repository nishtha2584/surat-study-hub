import axios from 'axios';


export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL, // http://localhost:3000
});

/* =========================
   ATTACH TOKEN
========================= */
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

/* =========================
   HANDLE REFRESH & GLOBAL ERRORS
========================= */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const errorMessage = error.response?.data?.message || error.message || "An unexpected system error occurred.";
        const status = error.response?.status;
        const requestUrl: string = originalRequest?.url ?? "";

        // Auth endpoints handle their own errors — never show a global notification for them
        const isAuthEndpoint =
            requestUrl.includes("/auth/login") ||
            requestUrl.includes("/auth/refresh") ||
            requestUrl.includes("/auth/logout");

        // Also skip if the caller explicitly tagged the request
        const skipNotification = isAuthEndpoint || originalRequest?._skipNotification;

        if (status !== 401 && !skipNotification) {
            // Log to console for development, but don't show a global UI alert
            // as pages should handle their own errors locally for better UX.
            console.error(`[API Error] ${status || "Network"}:`, errorMessage);
        }

        // Token-refresh flow — only attempt if we actually have a refresh token
        if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem("refreshToken");

            if (refreshToken) {
                try {
                    const res = await axios.post(
                        `${import.meta.env.VITE_API_URL}/auth/refresh`,
                        { refreshToken },
                    );

                    const { accessToken } = res.data.data;
                    localStorage.setItem("accessToken", accessToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return axios(originalRequest);
                } catch {
                    // Refresh failed — clear everything and send to login
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    window.location.href = "/login";
                }
            } else {
                // No refresh token available — redirect silently
                localStorage.removeItem("accessToken");
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    },
);