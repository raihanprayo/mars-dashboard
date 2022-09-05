import { useRef, useState, useEffect } from "react";
import { zeroPadStart } from "_utils/conversion";
import { DayId, DayEn, MonthId, MonthEn } from "_utils/enums";

function DateCounter() {
    const intervalRef = useRef(null);
    const [time, setTime] = useState(dateCounter("id"));

    useEffect(() => {
        intervalRef.current = setInterval(() => setTime(dateCounter("id")), 1050);
        return () => clearInterval(intervalRef.current);
    }, []);

    return (
        <span style={{ fontSize: 17 }}>
            <b>
                {time}
            </b>
        </span>
    );
}

function dateCounter(lang: "id" | "en") {
    const d = new Date();
    const dayLang = lang === "id" ? DayId : DayEn;
    const monthLang = lang === "id" ? MonthId : MonthEn;

    const day = dayLang[d.getDay() - 1];
    const month = monthLang[d.getMonth() - 1];
    const time = [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map((e) => zeroPadStart(e))
        .join(":");
    return `${day}, ${d.getDate()} ${month} ${d.getFullYear()} - ${time}`;
}

export default DateCounter;
