import { ReloadOutlined } from '@ant-design/icons';
import { Button, DatePicker, Space } from 'antd';
import { useCallback, useState } from 'react';
import moment, { Moment } from 'moment';
import { THeader } from '_comp/table/table.header';
import { endOfDay, startOfDay } from 'date-fns';

export default function LeaderboardPage() {
    const [range, setRange] = useState<[Moment, Moment]>([
        moment(startOfDay(Date.now())),
        moment(endOfDay(startOfDay(Date.now()))),
    ]);

    const refresh = useCallback(() => {
        
    }, [range]);

    return (
        <div className="workspace">
            <THeader>
                <THeader.Item>
                    <Space align="baseline">
                        <DatePicker.RangePicker
                            value={range}
                            showTime
                            onChange={(v) => setRange([v[0], v[1]])}
                        />
                        <Button type="primary" icon={<ReloadOutlined />} />
                    </Space>
                </THeader.Item>
            </THeader>
        </div>
    );
}
