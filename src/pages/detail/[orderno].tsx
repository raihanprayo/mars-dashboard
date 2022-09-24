import React, { useState } from 'react'
import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Menu, Space, Input, Button } from 'antd';

export default function orderno() {
    const { TextArea } = Input;
    const [value, setValue] = useState('');
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
                    <div className='detailOrderLeft'>
                        Order ID : {} <br/>
                        No Service : {} <br/>
                        Tiket NOSSA : {} <br/>
                        Status : {} <br/>
                    </div>
                    <div className='detailOrderRight'>
                        Umur Order : {} <br/>
                        Umur Action : {} <br/>
                        Kendala : {} <br/>
                        Keterangan : {} <br/>
                    </div>
                </div>
                <div className='detailSender'>
                    <div className='detailSenderLeft'>
                        Pengirim : {} <br/>
                        Service Type : {} <br/>
                        Request Type : {} <br/>
                        Witel : {} <br/>
                        STO : {} <br/>
                    </div>
                    <div className='detailSenderRight'>
                        Evidence : {} <br/>
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
                <Dropdown overlay={menu} trigger={['click']} open placement='bottom'>
                    <a onClick={e => e.preventDefault()}>
                        <Space>
                            Actual Solution 
                            <DownOutlined />
                        </Space>
                    </a>
                </Dropdown>
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
