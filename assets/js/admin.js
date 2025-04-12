jQuery(document).ready(function($) {
    // Elements
    const $addNewBtn = $('#abc-add-new');
    const $bannersTable = $('.abc-banners-table');
    const $bannerEditor = $('.abc-banner-editor');
    const $cancelEditBtn = $('#abc-cancel-edit');
    const $saveBannerBtn = $('#abc-save-banner');
    const $addSlideBtn = $('#abc-add-slide');
    const $slidesContainer = $('#abc-slides-container');
    
    // Show editor when Add New is clicked
    $addNewBtn.on('click', function() {
        $bannersTable.hide();
        $bannerEditor.show();
        resetEditor();
    });
    
    // Cancel editing
    $cancelEditBtn.on('click', function() {
        $bannersTable.show();
        $bannerEditor.hide();
    });
    
    // Add new slide
    $addSlideBtn.on('click', function() {
        addSlide();
    });
    
    // Save banner
    $saveBannerBtn.on('click', function() {
        saveBanner();
    });
    
    // Edit banner
    $(document).on('click', '.abc-edit-banner', function(e) {
        e.preventDefault();
        const bannerId = $(this).data('id');
        getBanner(bannerId);
    });
    
    // Delete banner
    $(document).on('click', '.abc-delete-banner', function(e) {
        e.preventDefault();
        const bannerId = $(this).data('id');
        if (confirm('Are you sure you want to delete this banner?')) {
            deleteBanner(bannerId);
        }
    });
    
    // Remove slide
    $(document).on('click', '.abc-remove-slide', function(e) {
        e.preventDefault();
        $(this).closest('.abc-slide').remove();
    });
    
    // Media uploader for images
    $(document).on('click', '.abc-upload-image', function(e) {
        e.preventDefault();
        const $inputField = $(this).siblings('.abc-slide-image');
        const $preview = $(this).siblings('.abc-image-preview');
        
        const frame = wp.media({
            title: 'Select or Upload Image',
            button: { text: 'Use this image' },
            multiple: false
        });
        
        frame.on('select', function() {
            const attachment = frame.state().get('selection').first().toJSON();
            $inputField.val(attachment.url).trigger('change');
            $preview.show().find('img').attr('src', attachment.url);
        });
        
        frame.open();
    });
    
    // Image preview when URL changes
    $(document).on('change', '.abc-slide-image', function() {
        const $preview = $(this).siblings('.abc-image-preview');
        const imageUrl = $(this).val();
        
        if (imageUrl) {
            $preview.show().find('img').attr('src', imageUrl);
        } else {
            $preview.hide();
        }
    });
    
    // Generate slug from name
    $('#abc-banner-name').on('blur', function() {
        if (!$('#abc-banner-slug').val()) {
            const slug = $(this).val().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            $('#abc-banner-slug').val(slug);
        }
    });
    
    // Add a new slide to the editor
    function addSlide(slideData = {}) {
        const slideId = Date.now();
        const slideHtml = `
            <div class="abc-slide" data-id="${slideId}">
                <div class="abc-form-group">
                    <label>Slide Title</label>
                    <input type="text" class="abc-slide-title regular-text" value="${slideData.title || ''}">
                </div>
                
                <div class="abc-form-group">
                    <label>Link URL</label>
                    <input type="text" class="abc-slide-link regular-text" value="${slideData.link || ''}">
                </div>
                
                <div class="abc-form-group">
                    <label>Image URL</label>
                    <button class="button abc-upload-image">Upload</button>
                    <input type="text" class="abc-slide-image regular-text" value="${slideData.image || ''}">
                    <div class="abc-image-preview" style="${slideData.image ? '' : 'display:none;'}">
                        <img src="${slideData.image || ''}" style="max-width:100px; height:auto;">
                    </div>
                </div>
                
                <div class="abc-form-group">
                    <label>Alt Text</label>
                    <input type="text" class="abc-slide-alt regular-text" value="${slideData.alt_text || ''}">
                </div>
                
                <button class="button abc-remove-slide">Remove Slide</button>
                <hr>
            </div>
        `;
        $slidesContainer.append(slideHtml);
    }
    
    // Reset editor to empty state
    function resetEditor() {
        $('#abc-banner-name').val('');
        $('#abc-banner-slug').val('');
        $slidesContainer.empty();
        
        // Reset settings to defaults
        const defaultSettings = JSON.parse(abc_admin_vars.default_settings);
        $('#abc-autoplay').prop('checked', defaultSettings.autoplay);
        $('#abc-autoplay-speed').val(defaultSettings.autoplay_speed);
        $('#abc-animation-speed').val(defaultSettings.animation_speed);
        $('#abc-pause-on-hover').prop('checked', defaultSettings.pause_on_hover);
        $('#abc-infinite-loop').prop('checked', defaultSettings.infinite_loop);
        $('#abc-show-arrows').prop('checked', defaultSettings.show_arrows);
        $('#abc-show-dots').prop('checked', defaultSettings.show_dots);
        $('#abc-slides-to-show').val(defaultSettings.slides_to_show);
        $('#abc-variable-width').prop('checked', defaultSettings.variable_width);
    }
    
    // Get banner data via AJAX
    function getBanner(bannerId) {
        $.ajax({
            url: abc_admin_vars.ajax_url,
            type: 'POST',
            data: {
                action: 'abc_get_banner',
                nonce: abc_admin_vars.nonce,
                id: bannerId
            },
            success: function(response) {
                if (response.success) {
                    loadBannerIntoEditor(response.data);
                    $bannersTable.hide();
                    $bannerEditor.show();
                } else {
                    alert('Error: ' + response.data);
                }
            },
            error: function() {
                alert('Request failed');
            }
        });
    }
    
    // Load banner data into editor
    function loadBannerIntoEditor(banner) {
        $('#abc-banner-name').val(banner.name);
        $('#abc-banner-slug').val(banner.slug);
        
        // Load settings
        if (banner.settings) {
            $('#abc-autoplay').prop('checked', banner.settings.autoplay);
            $('#abc-autoplay-speed').val(banner.settings.autoplay_speed);
            $('#abc-animation-speed').val(banner.settings.animation_speed);
            $('#abc-pause-on-hover').prop('checked', banner.settings.pause_on_hover);
            $('#abc-infinite-loop').prop('checked', banner.settings.infinite_loop);
            $('#abc-show-arrows').prop('checked', banner.settings.show_arrows);
            $('#abc-show-dots').prop('checked', banner.settings.show_dots);
            $('#abc-slides-to-show').val(banner.settings.slides_to_show);
            $('#abc-variable-width').prop('checked', banner.settings.variable_width);
        }
        
        // Load slides
        $slidesContainer.empty();
        if (banner.slides && banner.slides.length > 0) {
            banner.slides.forEach(slide => {
                addSlide(slide);
            });
        }
    }
    
    // Save banner via AJAX
    function saveBanner() {
        const name = $('#abc-banner-name').val().trim();
        const slug = $('#abc-banner-slug').val().trim();
        
        if (!name || !slug) {
            alert('Please enter both name and slug');
            return;
        }
        
        // Collect slides data
        const slides = [];
        $('.abc-slide').each(function() {
            slides.push({
                title: $(this).find('.abc-slide-title').val(),
                link: $(this).find('.abc-slide-link').val(),
                image: $(this).find('.abc-slide-image').val(),
                alt_text: $(this).find('.abc-slide-alt').val()
            });
        });
        
        if (slides.length === 0) {
            alert('Please add at least one slide');
            return;
        }
        
        // Collect settings
        const settings = {
            autoplay: $('#abc-autoplay').is(':checked'),
            autoplay_speed: parseInt($('#abc-autoplay-speed').val()),
            animation_speed: parseInt($('#abc-animation-speed').val()),
            pause_on_hover: $('#abc-pause-on-hover').is(':checked'),
            infinite_loop: $('#abc-infinite-loop').is(':checked'),
            show_arrows: $('#abc-show-arrows').is(':checked'),
            show_dots: $('#abc-show-dots').is(':checked'),
            slides_to_show: parseFloat($('#abc-slides-to-show').val()),
            variable_width: $('#abc-variable-width').is(':checked')
        };
        
        const data = {
            name: name,
            slug: slug,
            settings: JSON.stringify(settings),
            slides: JSON.stringify(slides)
        };
        
        // If editing existing banner
        const bannerId = $bannerEditor.data('banner-id');
        if (bannerId) {
            data.id = bannerId;
        }
        
        $.ajax({
            url: abc_admin_vars.ajax_url,
            type: 'POST',
            data: {
                action: 'abc_save_banner',
                nonce: abc_admin_vars.nonce,
                data: data
            },
            success: function(response) {
                if (response.success) {
                    alert('Banner saved successfully');
                    window.location.reload();
                } else {
                    alert('Error: ' + response.data);
                }
            },
            error: function() {
                alert('Request failed');
            }
        });
    }
    
    // Delete banner via AJAX
    function deleteBanner(bannerId) {
        $.ajax({
            url: abc_admin_vars.ajax_url,
            type: 'POST',
            data: {
                action: 'abc_delete_banner',
                nonce: abc_admin_vars.nonce,
                id: bannerId
            },
            success: function(response) {
                if (response.success) {
                    alert('Banner deleted successfully');
                    window.location.reload();
                } else {
                    alert('Error: ' + response.data);
                }
            },
            error: function() {
                alert('Request failed');
            }
        });
    }
});