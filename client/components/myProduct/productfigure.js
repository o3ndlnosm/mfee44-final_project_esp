import React from 'react'
import Heart from './heart-icon' // 假设 FavIcon 组件位于同一目录下的 FavIcon.js 文件中

const ProductFigure = ({ imageUrl, brand, name, price }) => {
  return (
    <div className="card m-2 border-0 shadow" style={{ width: '100%' }}>
      <img
        src={imageUrl}
        className="card-img-top"
        alt={name}
        style={{ height: '300px', width: 'auto', objectFit: 'cover' }}
      />
      <div className="card-body no-space-x">
        <p className="text-h6">{brand}</p>
        <p className="text-h3">{name}</p>
        <span className="text-my-notice text-h4">{price}</span>
        <div style={{ position: 'absolute', top: '3%', right: '5%' }}>
          <Heart />
        </div>
      </div>
    </div>
  )
}

export default ProductFigure
