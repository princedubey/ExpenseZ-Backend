// @desc    Get market news from newsdata.io
// @route   GET /api/news
// @access  Private
exports.getNews = async (req, res, next) => {
  try {
    const apikey = process.env.NEWSDATA_API_KEY || 'pub_c55a68e5732a4efcb77cd3124f78e117';
    const response = await fetch(
      `https://newsdata.io/api/1/market?apikey=${apikey}&country=in&language=en`
    );
    const rawData = await response.json();

    if (rawData.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: rawData.message || 'Failed to fetch news from provider',
      });
    }

    // Map newsdata.io schema to the format expected by the frontend:
    // link -> url
    // image_url -> image
    // title -> title
    // description -> description
    // source_id -> source
    // pubDate -> published_at
    const mappedData = (rawData.results || []).map((item) => ({
      url: item.link || '',
      image: item.image_url || null,
      title: item.title || '',
      description: item.description || '',
      source: item.source_id || 'Market News',
      published_at: item.pubDate || new Date().toISOString(),
    }));

    res.json({
      success: true,
      data: mappedData,
      pagination: {
        page: 1,
        limit: 10,
        total: rawData.totalResults || mappedData.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
