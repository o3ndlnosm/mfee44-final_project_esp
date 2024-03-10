import express from 'express'
import mydb from '../configs/mydb.js'
import mysql from 'mysql2'
const router = express.Router()

router.get('/overview', async (req, res) => {
  const type = req.query.type || null
  const state = req.query.state || null
  const search = req.query.search || null
  console.log('state:', typeof state)

  const baseSQL = `
    SELECT product.*, course_product.*, course_category.category_name, course_teacher.name AS teacher_name
    FROM product
    JOIN course_product ON product.id = course_product.product_id
    JOIN course_category ON course_product.category_id = course_category.id
    JOIN course_teacher ON course_product.teacher_id = course_teacher.id
    WHERE product.valid = 1
    `

  let finalSQL = baseSQL
  let inserts = []

  if (type) {
    finalSQL += ` AND category_id = ?`
    inserts.push(type)
  }
  if (search) {
    finalSQL += ` AND (product.name LIKE ? OR course_teacher.name LIKE ?)`
    inserts.push('' + search + '', '' + search + '')
  }

  if (state === '1') {
    finalSQL += ` ORDER BY student_num DESC`
  } else if (state === '2') {
    finalSQL += ` ORDER BY price`
  } else if (state === '3') {
    finalSQL += ` ORDER BY created_at DESC`
  }

  finalSQL = mysql.format(finalSQL, inserts)
  console.log('finalSQL:', finalSQL)

  try {
    const [results] = await mydb.execute(finalSQL)

    res.send(results)
  } catch (err) {
    console.error('查詢資料錯誤:', err)
    return res.status(500).json({ status: 'error', message: '資料庫查詢失敗' })
  }
})

router.get('/', async (req, res) => {
  try {
    const num = req.query.num || 3
    const [results] = await mydb.execute(
      `SELECT product.*, course_product.*, course_category.category_name, course_teacher.name AS teacher_name
      FROM product
      JOIN course_product ON product.id = course_product.product_id
      JOIN course_category ON course_product.category_id = course_category.id
      JOIN course_teacher ON course_product.teacher_id = course_teacher.id
      WHERE product.product_type = 2
      AND product.valid = 1
      LIMIT ${num}`
    )
    res.send(results)
  } catch (err) {
    console.error('查詢資料錯誤:', err)
    return res.status(500).json({ status: 'error', message: '資料庫查詢失敗' })
  }
})

router.get('/:id', async (req, res) => {
  if (isNaN(Number(req.params.id))) {
    res.status(400).send({ message: 'Invalid ID' })
    return
  }
  if (req.params.id < 214 || req.params.id > 273) {
    res.status(404).send({ message: 'Not found' })
    return
  }
  const [rows] = await mydb.execute(
    `SELECT product.*, course_product.*, course_category.category_name, course_teacher.name AS teacher_name, course_teacher.image AS teacher_image,course_teacher.introduction AS teacher_introduction
    FROM product  
    JOIN course_product ON product.id = course_product.product_id 
    JOIN course_category ON course_product.category_id = course_category.id
    JOIN course_teacher ON course_product.teacher_id = course_teacher.id
    WHERE product.product_type = 2
    AND product.valid = 1 
    AND product.id = ${req.params.id}`
  )
  const [rows2] = await mydb.execute(
    `SELECT * FROM course_units WHERE course_id = ${req.params.id}`
  )
  rows[0].units = rows2
  for (const unit of rows[0].units) {
    const [rows3] = await mydb.execute(
      `SELECT * FROM course_sub_units WHERE unit_id = ${unit.id}`
    )
    unit.sub_units = rows3
  }
  if (rows.length === 0) {
    res.status(404).send({ message: 'Course Not found' })
    return
  }
  res.status(200).send(rows)
})

export default router
