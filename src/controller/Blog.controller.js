import { ApiError, ApiResponse, AsyncHandler } from '../util/index.js';
import { User, Blog } from '../model/index.js';
import { uploadOnCloudinary } from '../util/cloudinary.js';
import { redisClient } from '../database/index.js';


export const GetTags = AsyncHandler(async (req, res) => {
    try {
        const tags = await redisClient.get('TAG');

        return res.status(200)
            .json(new ApiResponse(200, {tag: tags}, "Tags Fetched Successfully"));
    } catch (err) {
        console.log(err);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

export const CreateBlog = AsyncHandler(async (req, res) => {
    try {
        const { title, content, tags } = req.body;

        if (!title || !content || !tags) {
            return res.status(400).json(new ApiError(400, "Title and Content are required"));
        }

        const uploadedImage = await uploadOnCloudinary(req.files.image[0].path);

        if (!uploadedImage) {
            return res.status(500).json(new ApiError(500, "Internal Server Error"));
        }

        const oldTags = await redisClient.get('TAG');

        tags.forEach(async (tag) => {
            if (!oldTags.includes(tag)) {
                await redisClient.set('TAG', [...oldTags, tag]);
            }
        });

        const blog = await Blog.create({
            title: title,
            content: content,
            image: uploadedImage.url,
            tags: tags,
            author: req.user._id
        })

        if (!blog) {
            return res.status(500).json(new ApiError(500, "Blog Creation Failed"));
        }

        return res.status(201)
            .json(new ApiResponse(201, blog, "Blog Created Successfully"))

    } catch (err) {
        console.log(err);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

export const GetBlogs = AsyncHandler(async (req, res) => {
    try {
        const data = {};

        if ("tags" in req.query) {
            data.tags = {
                $in: req.query.tags,
            }
        }

        const blogs = await Blog.find(data).populate('author', 'name email username');

        if (!blogs) {
            return res.status(404).json(new ApiError(404, "No Blogs Found"));
        }

        return res.status(200)
            .json(new ApiResponse(200, blogs, "Blogs Fetched Successfully"));
    } catch (err) {
        console.log(err);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

export const GetBlog = AsyncHandler(async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('author', 'name email username');

        if (!blog) {
            return res.status(404).json(new ApiError(404, "Blog Not Found"));
        }

        return res.status(200)
            .json(new ApiResponse(200, blog, "Blog Fetched Successfully"));
    } catch (err) {
        console.log(err);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

export const UpdateBlog = AsyncHandler(async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json(new ApiError(404, "Blog Not Found"));
        }

        if (blog.author.toString() !== req.user._id.toString()) {
            return res.status(403).json(new ApiError(403, "Unauthorized"));
        }

        const data = {};

        if ("title" in req.body) {
            data.title = req.body.title;
        }
        if ("content" in req.body) {
            data.content = req.body.content;
        }
        if ("tags" in req.body) {
            data.tags = req.body.tags;

            const oldTags = await redisClient.get('TAG');

            req.body.tags.forEach(async (tag) => {
                if (!oldTags.includes(tag)) {
                    await redisClient.set('TAG', [...oldTags, tag]);
                }
            });
        }
        if ("image" in req.files) {
            const uploadedImage = await uploadOnCloudinary(req.files.image[0].path);

            if (!uploadedImage) {
                return res.status(500).json(new ApiError(500, "Internal Server Error"));
            }

            data.image = uploadedImage.url;
        }

        const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, data, {new: true});

        if (!updatedBlog) {
            return res.status(500).json(new ApiError(500, "Blog Updation Failed"));
        }

        return res.status(200)
            .json(new ApiResponse(200, updatedBlog, "Blog Updated Successfully"));
    } catch (err) {
        console.log(err);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

export const DeleteBlog = AsyncHandler(async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json(new ApiError(404, "Blog Not Found"));
        }

        if (blog.author.toString() !== req.user._id.toString()) {
            return res.status(403).json(new ApiError(403, "Unauthorized"));
        }

        await Blog.findByIdAndDelete(req.params.id);

        return res.status(200)
            .json(new ApiResponse(200, null, "Blog Deleted Successfully"));
    } catch (err) {
        console.log(err);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

export const LikeBlog = AsyncHandler(async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json(new ApiError(404, "Blog Not Found"));
        }

        if (blog.likes.includes(req.user._id)) {
            return res.status(400).json(new ApiError(400, "Blog Already Liked"));
        }

        const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, {
            $push: {likes: req.user._id}
        }, {new: true});

        if (!updatedBlog) {
            return res.status(500).json(new ApiError(500, "Blog Like Failed"));
        }

        return res.status(200)
            .json(new ApiResponse(200, updatedBlog, "Blog Liked Successfully"));
    } catch (err) {
        console.log(err);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

export const UnLikeBlog = AsyncHandler(async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json(new ApiError(404, "Blog Not Found"));
        }

        if (!blog.likes.includes(req.user._id)) {
            return res.status(400).json(new ApiError(400, "Blog Not Liked Yet"));
        }

        const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, {
            $pull: {likes: req.user._id}
        }, {new: true});

        if (!updatedBlog) {
            return res.status(500).json(new ApiError(500, "Blog UnLike Failed"));
        }

        return res.status(200)
            .json(new ApiResponse(200, updatedBlog, "Blog UnLiked Successfully"));
    } catch (err) {
        console.log(err);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

export const CommentOnBlog = AsyncHandler(async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json(new ApiError(404, "Blog Not Found"));
        }

        const comment = {
            content: req.body.content,
            user: req.user._id
        }

        const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, {
            $push: {comments: comment}
        }, {new: true});

        if (!updatedBlog) {
            return res.status(500).json(new ApiError(500, "Blog Comment Failed"));
        }

        return res.status(200)
            .json(new ApiResponse(200, updatedBlog, "Blog Commented Successfully"));
    } catch (err) {
        console.log(err);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

export const DeleteComment = AsyncHandler(async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json(new ApiError(404, "Blog Not Found"));
        }

        const comment = blog.comments.find(comment => comment._id.toString() === req.params.commentId);

        if (!comment) {
            return res.status(404).json(new ApiError(404, "Comment Not Found"));
        }

        if (comment.user.toString() !== req.user._id.toString() || blog.author.toString() !== req.user._id.toString()){
            return res.status(403).json(new ApiError(403, "Unauthorized"));
        }

        const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, {
            $pull: {comments: {_id: req.params.commentId}}
        }, {new: true});

        if (!updatedBlog) {
            return res.status(500).json(new ApiError(500, "Comment Deletion Failed"));
        }

        return res.status(200)
            .json(new ApiResponse(200, updatedBlog, "Comment Deleted Successfully"));
    } catch (err) {
        console.log(err);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});