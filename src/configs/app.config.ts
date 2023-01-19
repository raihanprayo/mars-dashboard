const config = {
    witel: (process.env.MARS_WITEL || Mars.Witel.ROC) as Mars.Witel,
};

export default config;

declare global {
    type MarsApplicationInfo = typeof config;
}
