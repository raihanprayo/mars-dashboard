const config = {
    witel: (process.env.MARS_WITEL || Mars.Witel.ROC) as Mars.Witel,
    service: {
        url: process.env.MARS_SERVICE_URL,
    },
    directory: {
        shared: process.env.MARS_SHARED_DIRECTORY,
    },
};

console.log('* Current Witel:', config.witel);
export default config;

declare global {
    type MarsApplicationInfo = typeof config;
}
