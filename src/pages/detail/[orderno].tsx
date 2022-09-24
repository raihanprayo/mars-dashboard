import React, { useState, useEffect } from 'react'
import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Menu, Space, Input, Button } from 'antd';
import { usePageable } from "_hook/pageable.hook";
import { HttpHeader, upperCase } from "@mars/common";
import { useRouter } from 'next/router';


export default function orderno(props: TableTicketProps) {
    const {
        pageable: { page, size },
        setPageable,
    } = usePageable();
    const { TextArea } = Input;
    const [value, setValue] = useState('');
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<DTO.Orders>();
    const [filter, setFilter] = useState<Partial<DTO.Orders>>({});

    const bebas = useRouter()

    useEffect(() => {
        setLoading(true);
        getData(bebas.query.orderno as string,{ page, size, ...filter })
            .then((res) => {
                setOrders(res.data);
                console.log(res.data);
            })
            .catch((err) => {})
            .finally(() => setLoading(false));
    }, [page, size]);

    const request = (
        <Menu
            items={[
                {
                    label: <div>
                        Order ID : XXXXXXXXX <br/>
                        Agent : Agent ybs <br/>
                        Actual Solution : abcdefgh <br/>
                        Worklog :abcdefgh 
                    </div>,
                    key:'0',
                },
            ]}
        />
    )
    const menu = (
        <Menu
          mode='inline'
          items={[
            {
              label: <a href="https://www.antgroup.com">Actual Solution 1</a>,
              key: '0',
            },
            {
              label: <a href="https://www.aliyun.com">Actual Solution 2</a>,
              key: '1',
            },
            {
              label: <a href="https://www.antgroup.com">Actual Solution 3</a>,
              key: '2',
            },
            {
              label: <a href="https://www.aliyun.com">Actual Solution 4</a>,
              key: '3',
            },
            {
                label: <a href="https://www.antgroup.com">Actual Solution 5</a>,
                key: '4',
            },
            {
                label: <a href="https://www.aliyun.com">Actual Solution 6</a>,
                key: '5',
            },
          ]}
        />
      );

  return (
    <div className='containerDetail'>
        <div style={{display:'flex'}}>
            <div className='detailLeft'>
                <div className='detailOrder'>
                    {orders&&<>
                        <div className='detailOrderLeft'>
                            Order ID : {orders.orderno} <br/>
                            No Service : {orders.serviceno} <br/>
                            Tiket NOSSA : {orders.incidentno} <br/>
                            Status : {orders.status} <br/>
                        </div>
                        <div className='detailOrderRight'>
                            Umur Order : {'0'} <br/>
                            Umur Action : {'0'} <br/>
                            Kendala : {orders.problemtype} <br/>
                            Keterangan : {orders.notes} <br/>
                        </div>
                    </>
                    }
                </div>
                <div className='detailSender'>
                    <div className='detailSenderLeft'>
                        Pengirim : {orders?.sendername} <br/> 
                        Service Type : {'lewatin'} <br/>
                        Request Type : {'lewatin'} <br/>
                        Witel : {orders?.witel} <br/>
                        STO : {orders?.sto} <br/>
                    </div>
                    <div className='detailSenderRight'>
                        Evidence : {orders?.attachment} <br/>
                    </div>
                </div>
            </div>
            <div className='detailRight'>
                <span className='textGaul'>Nomor ini telah terjadi GAUL sebanyak X Kali dengan Request Type Internet lambat </span> <br/>
                <Dropdown overlay={request} trigger={['click']}  placement='bottom' className='dropdownGaul'>
                        <a onClick={e => e.preventDefault()}>
                            <Space>
                                hh mm yyyy
                                <DownOutlined />
                            </Space>
                        </a>
                </Dropdown> <br/>
                <Dropdown overlay={request} trigger={['click']}  placement='bottom' className='dropdownGaul'>
                        <a onClick={e => e.preventDefault()}>
                            <Space>
                                hh mm yyyy
                                <DownOutlined />
                            </Space>
                        </a>
                </Dropdown> <br/>
                <Dropdown overlay={request} trigger={['click']}  placement='bottom' className='dropdownGaul'>
                        <a onClick={e => e.preventDefault()}>
                            <Space>
                                hh mm yyyy
                                <DownOutlined />
                            </Space>
                        </a>
                </Dropdown>
            </div>
        </div>
        <div className='detailWork'>
            <div className='dropdownSolution'>
            <Menu
          mode='inline'
          items={[
            {
                label: <span>Actual Solution</span>,
                type:'group',
                children: [
                    {
                        label: <a href="https://www.antgroup.com">Actual Solution 1</a>,
                        key: '0',
                      },
                      {
                        label: <a href="https://www.aliyun.com">Actual Solution 2</a>,
                        key: '1',
                      },
                      {
                        label: <a href="https://www.antgroup.com">Actual Solution 3</a>,
                        key: '2',
                      },
                      {
                        label: <a href="https://www.aliyun.com">Actual Solution 4</a>,
                        key: '3',
                      },
                ]
            },
            
          ]}
        />
            </div>
            <div className='workLog'>
                <TextArea
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder="Ini Field untuk agent mengisi history (worklog) pengerjaan"
                    autoSize={{ minRows: 10, maxRows: 10 }}
                />
            </div>
            <div className='buttonDetail'>
                <div className='insideButton'>
                    <Button type="primary" block className='closeTicket'>
                        Close Ticket
                    </Button>
                    <Button type="primary" block className='dispatch'>
                        Dispatch
                    </Button>
                    <Button type="primary" block className='pending'>
                        Pending
                    </Button>
                </div>
            </div>
        </div>
    </div>
  )
}

function getData(id:string,params: map = {}, inbox = false) {
    const url = `/order/by-noorder/${id}`;
    return api.get<DTO.Orders>(url, {
        params,
    });
}

interface TableTicketProps {
}
