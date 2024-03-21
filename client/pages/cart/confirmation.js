import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import ProgressBar from '@/components/myCart/progressBar'
import OrderSummary from '@/components/myCart/orderSummary'
import SmallProductCart from '@/components/myCart/smallProductCart'
import SmallCourseCart from '@/components/myCart/smallCourseCart'
import OrderConfirmList from '@/components/myCart/orderConfirmList'
import ShippingRule from '@/components/myCart/shippingRule'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import { jwtDecode } from 'jwt-decode'

// //勾子context
import { useCart } from '@/hooks/user-cart'
import { useCheckout } from '@/hooks/use-checkout'

export default function Confirmation() {
  const { rawTotalPrice, totalPrice, selectCoupon, formData } = useCheckout()
  console.log(formData)
  const { cart, cartCourse, cartGeneral, formatPrice } = useCart()

  //取得token 令牌
  const [token, setToken] = useState('')

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    // console.log(storedToken)
    if (storedToken) {
      setToken(storedToken)
    }
  }, []) // 空依賴數組確保只在組件掛載時運行

  //linePay資料使用
  const [linePayOrder, setLinePayOrder] = useState({})

  const router = useRouter()

  /* 後端請求建立訂單 建立訂單到server,packages與order id由server產生 */
  const creatOrder = async () => {
    // products將會組合在packages屬性之下
    try {
      const res = await fetch(
        'http://localhost:3005/api/line-pay-first/creatOrder',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: totalPrice,
            products: [
              {
                id: Date.now(),
                name: '墨韻雅筆',
                imageUrl:
                  'https://live.staticflickr.com/65535/53580691499_b1dd0e8a55_o.jpg',
                quantity: 1,
                price: totalPrice,
              },
            ],
            formData,
            cart,
          }),
        }
      )

      const data = await res.json() //解析回傳的json檔案
      console.log(data) // /訂單物件格式(line-pay專用)
      if (data.status === 'success') {
        setLinePayOrder(data.data.order)
      }
      return data //
    } catch (error) {
      console.error('創建訂單失敗', error)
      return { status: 'error' } //明確返回一個錯誤狀態,好讓付款函數可以透過狀態判定才去執行,解決延遲問題
    }
  }

  /* 向後端請求付款  導向至LINE Pay付款頁面 */
  const goLinePay = async (orderId) => {
    if (window.confirm('請確認導向至LINE PAY進行付款嗎？')) {
      window.location.href = `http://localhost:3005/api/line-pay-first/reserve?orderId=${orderId}`
      localStorage.removeItem('checkout_info')
      localStorage.removeItem('check_info')
      localStorage.removeItem('selectedCouponID')
      localStorage.removeItem('cart')
    }
  }

  const goEcPay = async (orderId) => {
    if (window.confirm('請確認導向至ECPAY進行付款嗎？')) {
      window.location.href = `http://localhost:3005/api/ecpay?orderId=${orderId}`
      localStorage.removeItem('checkout_info')
      localStorage.removeItem('check_info')
      localStorage.removeItem('selectedCouponID')
      localStorage.removeItem('cart')
    }
  }

  //點擊付款行為＝創建訂單+請求linePay API
  const creatOrderAndPay = async () => {
    if (cart.length < 0) {
      toast.error('購物車沒有商品,請進行選購')
    } else {
      const orderResponse = await creatOrder()
      if (orderResponse.status === 'success') {
        await toast.success('已成功建立訂單')

        setTimeout(() => {
          if (formData.payType === 'LinePay') {
            goLinePay(orderResponse.data.order.orderId)
          } else if (formData.payType === 'EcPay') {
            goEcPay(orderResponse.data.order.orderId)
          }
        }, 1500)
      } else {
        toast.error(orderResponse.message, {
          duration: 3000,
        })
      }
    }
  }

  //confirm 用戶付款成功後，跳轉回來的行為，
  useEffect(() => {
    if (router.isReady) {
      // http://localhost:3000/cart/confirmation?transactionId=2022112800733496610&orderId=da3b7389-1525-40e0-a139-52ff02a350a8
      // 這裡要得到交易id，處理伺服器通知line pay已確認付款，為必要流程
      // TODO: 除非為不需登入的交易，為提高安全性應檢查是否為會員登入狀態
      const { transactionId, orderId } = router.query
      if (!transactionId || !orderId) {
        // 如果沒有帶transactionId或orderId時，導向至首頁(或其它頁)

        return
      }
    }
  }, [router.isReady, router.query])
  return (
    <>
      <ProgressBar
        percentage={90}
        text={'結帳進度'}
        textColor={'var(--my-white)'}
      />
      <div className="row">
        {/* 左邊 */}
        <div className="col-lg-7">
          <div className="mt-5">
            <OrderConfirmList formData={formData} selectCoupon={selectCoupon} />
            <Link href={'/cart/checkout?checkout_info=true'}>
              <div className="back-button col-lg-4 ms-auto mt-5">
                返回資料修改
              </div>
            </Link>
          </div>
        </div>
        {/* 右邊 */}
        <div className="col-lg-1 "></div>
        <div className="col-lg-4 mt-5">
          <div className="OrderSummary-container mb-5">
            <OrderSummary
              text="付款"
              boolean={true}
              totalPrice={totalPrice}
              rawTotalPrice={rawTotalPrice}
              formatPrice={formatPrice}
              creatOrderAndPay={creatOrderAndPay}
              shippingFee={formData.shippingFee}
              discount_value={selectCoupon.discount_value}
            />
          </div>
          <div className="text-h4 mb-4">我的購物車</div>
          <SmallProductCart
            cartGeneral={cartGeneral}
            formatPrice={formatPrice}
          />
          <SmallCourseCart cartCourse={cartCourse} formatPrice={formatPrice} />
          <div className="my-5">
            <ShippingRule />
          </div>
          <div
            onClick={creatOrderAndPay}
            className="my-button1 my-3 rwd-button"
          >
            付款
          </div>
        </div>
        <Toaster />
      </div>
      <style jsx>{`
        .rwd-button {
          display: none;
        }
        @media (max-width: 991px) {
          .OrderSummary-container {
            position: static;
            top: 0&;
            left: 0;
          }
          .rwd-button {
            display: flex;
          }
        }
        .back-button {
          display: flex;

          padding: 8.25px 0px 9.25px 0px;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
          border-radius: 37.5px;
          border: 1.125px solid var(--my-primary);
          font-size: $h6;
          font-weight: 400;
          color: var(--my-primary);
          cursor: pointer;

          &:hover {
            background-color: var(--my-gray);
            border-radius: 37.5px;
            color: var(--my-white);
          }
        }
      `}</style>
    </>
  )
}
