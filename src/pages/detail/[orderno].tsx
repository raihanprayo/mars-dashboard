import React from 'react'

export default function orderno() {
  return (
    <div className='containerDetail'>
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
        <div className='detailWork'>
            <div></div>
            <div></div>
            <div></div>
        </div>
    </div>
  )
}
