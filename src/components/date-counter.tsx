import { format } from "date-fns";
import { id as IdnLocale, enUS as EnLocale } from "date-fns/locale";
import { useRef, useState, useEffect } from "react";

function DateCounter() {
    const intervalRef = useRef(null);
    const [time, setTime] = useState(dateCounter("id"));

    useEffect(() => {
        intervalRef.current = setInterval(() => setTime(dateCounter("id")), 60_000);
        return () => clearInterval(intervalRef.current);
    }, []);

    return (
        <span style={{ fontSize: 17 }}>
            <b>{time}</b>
        </span>
    );
}

function dateCounter(lang: "id" | "en") {
    const d = new Date();
    const locale = lang === "id" ? IdnLocale : EnLocale;
    return format(d, "EEEE, dd MMMM yyyy - HH:mm aa", { locale });
}

export default DateCounter;
