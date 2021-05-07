const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');

// The `/api/tags` endpoint

router.get('/', async (req, res) => {
  // find all tags
  // be sure to include its associated Product data
  try {
    const tagsData = await Tag.findAll({
      include: [{ model: Product, through: ProductTag, as: 'tagged_products' }]
    });
    res.status(200).json(tagsData);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

router.get('/:id', async (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data
  try {
    const tagData = await Tag.findByPk(req.params.id, {
      include: [{ model: Product, through: ProductTag, as: 'tagged_products' }]
    });
    res.status(200).json(tagData);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

router.post('/', (req, res) => {
  /* 
    {
      tag_name: "yellow",
      productIds: [1, 2, 5]
    }
  */
  // create a new tag
  Tag.create(req.body)
    .then((tag) => {
      if (req.body.productIds.length) {
        const taggedProductIdArr = req.body.productIds.map((product_id) => {
          return {
            product_id,
            tag_id: tag.id,
          };
        });
        return ProductTag.bulkCreate(taggedProductIdArr);
      }
      res.status(200).json(tag);
    })
    .then((taggedProductIds) => res.status(200).json(taggedProductIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.put('/:id', (req, res) => {
  // update a tag's name by its `id` value
  Tag.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then(() => {
      // find all associated products from ProductTag
      return ProductTag.findAll({ where: { tag_id: req.params.id } });
    })
    .then((taggedProducts) => {
      // get list of current product_ids
      const taggedProductIds = taggedProducts.map(({ product_id }) => product_id);
      // create filtered list of new product_ids
      const newTaggedProducts = req.body.productIds
        .filter((product_id) => !taggedProductIds.includes(product_id))
        .map((product_id) => {
          return {
            product_id,
            tag_id: req.params.id,
          };
        });
      // figure out which ones to remove
      const taggedProductsToRemove = taggedProducts
        .filter(({ product_id }) => !req.body.productIds.includes(product_id))
        .map(({ id }) => id);

      // run both actions
      return Promise.all([
        ProductTag.destroy({ where: { id: taggedProductsToRemove } }),
        ProductTag.bulkCreate(newTaggedProducts),
      ]);
    })
    .then((updatedTaggedProducts) => res.json(updatedTaggedProducts))
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', async (req, res) => {
  // delete on tag by its `id` value
  try {
    const tagData = await Tag.destroy({
      where: {
        id: req.params.id
      }
    });

    if (!tagData) {
      res.status(404).json({ message: 'No tag found with this id!' });
      return;
    }

    res.status(200).json(tagData);
    
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
