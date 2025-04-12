<?php
class ABC_Frontend {
    public function __construct() {
        add_shortcode('abc_banner', array($this, 'render_banner_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
    }

    public function enqueue_scripts() {
        // Only load assets when shortcode is present
        if (has_shortcode(get_post()->post_content, 'abc_banner')) {
            // CSS
            wp_enqueue_style('abc-carousel-css', ABC_PLUGIN_URL . 'assets/css/carousel.css', array(), ABC_VERSION);
            
            // JavaScript
            wp_enqueue_script('abc-carousel-js', ABC_PLUGIN_URL . 'assets/js/carousel.js', array(), ABC_VERSION, true);
            
            // Add preload for first slide image
            $this->preload_first_slide();
        }
    }

    private function preload_first_slide() {
        global $post;
        
        // Find all abc_banner shortcodes in the post
        if (preg_match_all('/\[abc_banner\s+slug=["\']([^"\']+)["\']/', $post->post_content, $matches)) {
            $first_slider_slug = $matches[1][0];
            $banner = ABC_DB::get_banner($first_slider_slug);
            
            if ($banner && !empty($banner->slides)) {
                $slides = maybe_unserialize($banner->slides);
                if (!empty($slides[0]['image'])) {
                    add_action('wp_head', function() use ($slides) {
                        echo '<link rel="preload" as="image" href="'.esc_url($slides[0]['image']).'" fetchpriority="high">';
                    }, 1);
                }
            }
        }
    }

    public function render_banner_shortcode($atts) {
        $atts = shortcode_atts(array(
            'slug' => ''
        ), $atts);
        
        if (empty($atts['slug'])) {
            return '<p class="abc-error">Please specify a banner slug</p>';
        }
        
        $banner = ABC_DB::get_banner($atts['slug']);
        
        if (!$banner) {
            return '<p class="abc-error">Banner not found</p>';
        }
        
        $slides = maybe_unserialize($banner->slides);
        $settings = maybe_unserialize($banner->settings);
        
        if (empty($slides) || !is_array($slides)) {
            return '<p class="abc-error">No slides found for this banner</p>';
        }
        
        // Default settings
        $default_settings = json_decode(get_option('abc_default_settings'), true);
        $settings = wp_parse_args($settings, $default_settings);
        
        ob_start();
        ?>
        <div class="abc-banner-carousel" 
             data-settings="<?php echo esc_attr(json_encode($settings)); ?>">
            <div class="abc-carousel-inner">
                <?php foreach ($slides as $index => $slide) : 
                    $image_data = $this->get_optimized_image_data($slide['image'], $index + 1, $slide['alt_text']);
                ?>
                    <div class="abc-slide" data-index="<?php echo $index; ?>">
                        <?php if (!empty($slide['link'])) : ?>
                            <a href="<?php echo esc_url($slide['link']); ?>" class="abc-slide-link">
                        <?php endif; ?>
                        
                        <img src="<?php echo esc_url($image_data['url']); ?>"
                             alt="<?php echo esc_attr($image_data['alt']); ?>"
                             width="<?php echo esc_attr($image_data['width']); ?>"
                             height="<?php echo esc_attr($image_data['height']); ?>"
                             loading="<?php echo esc_attr($image_data['loading']); ?>"
                             fetchpriority="<?php echo esc_attr($image_data['fetchpriority']); ?>"
                             decoding="<?php echo esc_attr($image_data['decoding']); ?>"
                             class="abc-slide-image <?php echo $index === 0 ? 'abc-first-slide' : ''; ?>"
                        />
                        
                        <?php if (!empty($slide['title'])) : ?>
                            <div class="abc-slide-title"><?php echo esc_html($slide['title']); ?></div>
                        <?php endif; ?>
                        
                        <?php if (!empty($slide['link'])) : ?>
                            </a>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
            
            <?php if ($settings['show_arrows']) : ?>
                <button class="abc-carousel-prev" aria-label="Previous slide">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
                    </svg>
                </button>
                <button class="abc-carousel-next" aria-label="Next slide">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                </button>
            <?php endif; ?>
            
            <?php if ($settings['show_dots']) : ?>
                <div class="abc-carousel-dots">
                    <?php foreach ($slides as $index => $slide) : ?>
                        <button class="abc-dot <?php echo $index === 0 ? 'active' : ''; ?>" 
                                data-index="<?php echo $index; ?>"
                                aria-label="Go to slide <?php echo $index + 1; ?>"></button>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    private function get_optimized_image_data($image_url, $position = 1, $alt_text = '') {
        $image_id = attachment_url_to_postid($image_url);
        
        if (!$image_id) {
            return array(
                'url' => esc_url($image_url),
                'width' => '100%',
                'height' => 'auto',
                'alt' => sanitize_text_field($alt_text),
                'loading' => $position <= 2 ? 'eager' : 'lazy',
                'fetchpriority' => $position === 1 ? 'high' : 'auto',
                'decoding' => $position === 1 ? 'sync' : 'async'
            );
        }
        
        $size = 'full'; // We'll handle responsive sizing with CSS
        $image_data = wp_get_attachment_image_src($image_id, $size);
        
        if (empty($alt_text)) {
            $alt_text = get_post_meta($image_id, '_wp_attachment_image_alt', true);
        }
        
        return array(
            'url' => $image_data ? esc_url($image_data[0]) : esc_url($image_url),
            'width' => $image_data ? $image_data[1] : '100%',
            'height' => $image_data ? $image_data[2] : 'auto',
            'alt' => sanitize_text_field($alt_text),
            'loading' => $position <= 2 ? 'eager' : 'lazy',
            'fetchpriority' => $position === 1 ? 'high' : 'auto',
            'decoding' => $position === 1 ? 'sync' : 'async'
        );
    }
}