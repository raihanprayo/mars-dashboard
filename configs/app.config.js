module.exports = {
    browser: {},

    server: {},

    general: {
        service: {
            url: process.env.SERVICE_URL,
            api_url: process.env.SERVICE_URL + (process.env.SERVICE_API_PATH || ''),
            file_url: process.env.SERVICE_URL + (process.env.SERVICE_FILE_PATH || ''),
        },
        directory: {
            shared: process.env.MARS_SHARED_DIRECTORY || 'D:/TMP/mars'
        }
    },
};
