<?php
/**
 * Plugin Name: Jigsaw Featured Image Puzzle (Shortcode)
 * Description: Creates a jigsaw puzzle game from the post featured image using shortcode [jigsaw_puzzle]. Desktop 300 pieces, mobile 200 pieces.
 * Version: 2.1.1
 */

if (!defined('ABSPATH')) exit;

add_action('wp_enqueue_scripts', function () {
  $base = plugin_dir_url(__FILE__);
  wp_register_style('jfpuzzle-style', $base . 'assets/style.css', [], '3.0.0');
  wp_register_script('jfpuzzle-script', $base . 'assets/script.js', [], '3.0.0', true);
});


// Create DB table on activation
register_activation_hook(__FILE__, function () {
  global $wpdb;
  $table = $wpdb->prefix . 'jfp_scores';
  $charset_collate = $wpdb->get_charset_collate();

  $sql = "CREATE TABLE $table (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    post_id BIGINT(20) UNSIGNED NOT NULL,
    user_id BIGINT(20) UNSIGNED NOT NULL,
    time_seconds INT(11) UNSIGNED NOT NULL,
    moves INT(11) UNSIGNED NOT NULL DEFAULT 0,
    pieces INT(11) UNSIGNED NULL,
    completed_at DATETIME NOT NULL,
    PRIMARY KEY  (id),
    KEY post_id (post_id),
    KEY user_id (user_id),
    KEY time_seconds (time_seconds),
    KEY completed_at (completed_at)
  ) $charset_collate;";

  require_once ABSPATH . 'wp-admin/includes/upgrade.php';
  dbDelta($sql);
});

// REST API endpoints for saving score + leaderboard
add_action('rest_api_init', function () {
  register_rest_route('jfp/v1', '/score', [
    'methods'  => 'POST',
    'permission_callback' => function () {
      return is_user_logged_in();
    },
    'callback' => function (WP_REST_Request $req) {
      global $wpdb;
      $table = $wpdb->prefix . 'jfp_scores';

      $post_id = absint($req->get_param('post_id'));
      $time    = absint($req->get_param('time_seconds'));
      $moves   = absint($req->get_param('moves'));
      $pieces  = absint($req->get_param('pieces'));

      if (!$post_id || $time <= 0) {
        return new WP_REST_Response(['ok' => false, 'message' => 'Invalid data'], 400);
      }

      $user_id = get_current_user_id();

      $wpdb->insert($table, [
        'post_id'       => $post_id,
        'user_id'       => $user_id,
        'time_seconds'  => $time,
        'moves'         => $moves,
        'pieces'        => $pieces ?: null,
        'completed_at'  => current_time('mysql'),
      ], ['%d','%d','%d','%d','%d','%s']);

      return ['ok' => true];
    }
  ]);

  register_rest_route('jfp/v1', '/leaderboard', [
    'methods'  => 'GET',
    'permission_callback' => '__return_true',
    'callback' => function (WP_REST_Request $req) {
      global $wpdb;
      $table = $wpdb->prefix . 'jfp_scores';
      $post_id = absint($req->get_param('post_id'));
      if (!$post_id) return new WP_REST_Response(['ok'=>false,'message'=>'Missing post_id'], 400);

      $rows = $wpdb->get_results($wpdb->prepare("
        SELECT s.user_id, s.time_seconds, s.moves, s.completed_at, u.display_name
        FROM $table s
        LEFT JOIN {$wpdb->users} u ON u.ID = s.user_id
        WHERE s.post_id = %d
        ORDER BY s.time_seconds ASC, s.moves ASC, s.completed_at ASC
        LIMIT 10
      ", $post_id), ARRAY_A);

      return ['ok'=>true,'items'=>$rows];
    }
  ]);
});

add_shortcode('jigsaw_puzzle', function ($atts = []) {
  $atts = shortcode_atts([
    'post_id' => 0,
    'height'  => '80vh',
  ], $atts, 'jigsaw_puzzle');

  $post_id = intval($atts['post_id']);
  if ($post_id <= 0) $post_id = get_the_ID();

  if (!$post_id) return '<div>Jigsaw Puzzle: cannot detect post.</div>';

  $img_url = get_the_post_thumbnail_url($post_id, 'full');
  if (!$img_url) return '<div>Jigsaw Puzzle: this post has no featured image.</div>';

  wp_enqueue_style('jfpuzzle-style');
  wp_enqueue_script('jfpuzzle-script');

  wp_localize_script('jfpuzzle-script', 'JFPuzzleData', [
    'imageUrl' => esc_url_raw($img_url),
    'postId'  => $post_id,
    'restUrl' => esc_url_raw(rest_url('jfp/v1')),
    'nonce'   => wp_create_nonce('wp_rest'),
    'loggedIn'=> is_user_logged_in() ? 1 : 0,
  ]);
ob_start(); ?>
  <div class="jfpuzzle-wrap" style="width:100%;height:<?php echo esc_attr($atts['height']); ?>;">
    <div class="jfpuzzle-stage" id="jfpuzzle-stage">
      <div id="forPuzzle"></div>

      <ul id="menu" aria-label="Puzzle menu">
        <li title="Menu">&#x2630;</li>
        <li title="Reload image">Reload image 🔄</li>
        <li>shape:
          <select id="shape">
            <option value="1" selected>classic</option>
            <option value="2">triangle</option>
            <option value="3">round</option>
            <option value="4">straight</option>
          </select>
        </li>
      
        <li id="jfpuzzle-howto" title="How to play">How to play ❔</li>
        <li title="Background">background:
          <select id="jfpuzzle-bg">
            <option value="#fff1e7" selected>default</option>
            <option value="#ffffff">white</option>
            <option value="#111827">dark</option>
            <option value="#eef2ff">indigo</option>
            <option value="#ecfeff">cyan</option>
            <option value="#f0fdf4">mint</option>
          </select>
        </li>

      </ul>
    </div>

    <div class="jfpuzzle-bar" aria-label="Puzzle controls">
      <button type="button" class="jfpuzzle-btn" id="jfpuzzle-restart">🔄 Restart</button>
      <button type="button" class="jfpuzzle-btn" id="jfpuzzle-preview" title="Show preview (3s)">👁 Preview</button>

      <div class="jfpuzzle-status" aria-label="Progress and time">
        <span id="jfpuzzle-progress">0%</span>
        <span class="jfpuzzle-sep">•</span>
        <span id="jfpuzzle-time">00:00</span>
        <button type="button" class="jfpuzzle-btn jfpuzzle-btn--mini" id="jfpuzzle-pause" aria-label="Pause or resume timer">⏸ Pause</button>
      </div>

      <button type="button" class="jfpuzzle-btn" id="jfpuzzle-fullscreen">⛶ Fullscreen</button>
    </div>

    <div class="jfpuzzle-leaderboard" data-post-id="<?php echo esc_attr($post_id); ?>">

	  <?php if (is_user_logged_in()): ?>
		<div class="jfpuzzle-login-hint" style="display:flex;gap:10px;align-items:center;justify-content:space-between;">
		  <div>Xin chào, <b><?php echo esc_html(wp_get_current_user()->display_name); ?></b></div>
		  <a class="button" href="<?php echo esc_url(wp_logout_url(get_permalink($post_id))); ?>">Logout</a>
		</div>
	  <?php else: ?>
		<div class="jfpuzzle-login-hint">
		  Vui lòng đăng nhập để lưu kết quả &amp; xem xếp hạng.
		  <div class="jfpuzzle-login-buttons">
			<?php echo do_shortcode('[jigsaw_social_login_buttons]'); ?>
		  </div>
		</div>
	  <?php endif; ?>

	  <h3>Top 10</h3>
	  <ol id="jfpuzzle-top10"></ol>
	</div>



    <div class="jfpuzzle-modal" id="jfpuzzle-help" aria-hidden="true" style="display:none;">
      <div class="jfpuzzle-modal__dialog" role="dialog" aria-modal="true" aria-label="How to play">
        <div class="jfpuzzle-modal__header">
          <div class="jfpuzzle-modal__title">How to play</div>
          <button type="button" class="jfpuzzle-btn jfpuzzle-btn--mini" id="jfpuzzle-help-close" aria-label="Close">✕</button>
        </div>
        <div class="jfpuzzle-modal__body">
          <ol>
            <li>Tap <b>Menu</b> (☰) to open controls.</li>
            <li>Choose a <b>shape</b>, then the game restarts with that shape.</li>
            <li>Drag pieces into place. When pieces match, they snap together.</li>
            <li>Use <b>Restart</b> to reshuffle. Use <b>Fullscreen</b> for a bigger board.</li>
          </ol>
          <p style="margin:0;opacity:.75;">Tip: on mobile, the game uses 200 pieces for smoother play.</p>
        </div>
      </div>
    </div>

  </div>
  <?php
return ob_get_clean();
});

// ============================================================================
// Custom Google/Facebook login (NO Nextend). Buttons only show inside puzzle.
// ============================================================================

if (!defined('JFP_SOCIAL_OPT')) {
  define('JFP_SOCIAL_OPT', 'jfp_social_login_opts');
}

/**
 * Settings page: nhập Google/Facebook credentials
 */
add_action('admin_menu', function () {
  add_options_page(
    'JFP Social Login',
    'JFP Social Login',
    'manage_options',
    'jfp-social-login',
    'jfp_social_login_settings_page'
  );
});

add_action('admin_init', function () {
  register_setting('jfp_social_login_group', JFP_SOCIAL_OPT);

  add_settings_section('jfp_sl_main', 'OAuth Settings', '__return_false', 'jfp-social-login');
  add_settings_field('google_client_id', 'Google Client ID', 'jfp_sl_field_text', 'jfp-social-login', 'jfp_sl_main', ['key' => 'google_client_id']);
  add_settings_field('google_client_secret', 'Google Client Secret', 'jfp_sl_field_text', 'jfp-social-login', 'jfp_sl_main', ['key' => 'google_client_secret']);
  add_settings_field('fb_app_id', 'Facebook App ID', 'jfp_sl_field_text', 'jfp-social-login', 'jfp_sl_main', ['key' => 'fb_app_id']);
  add_settings_field('fb_app_secret', 'Facebook App Secret', 'jfp_sl_field_text', 'jfp-social-login', 'jfp_sl_main', ['key' => 'fb_app_secret']);
});

function jfp_social_login_settings_page() {
  if (!current_user_can('manage_options')) return;
  ?>
  <div class="wrap">
    <h1>JFP Social Login</h1>
    <p><b>Google Redirect URI:</b> <?php echo esc_html(jfp_google_redirect_uri()); ?></p>
    <p><b>Facebook Redirect URI:</b> <?php echo esc_html(jfp_fb_redirect_uri()); ?></p>
    <form method="post" action="options.php">
      <?php
      settings_fields('jfp_social_login_group');
      do_settings_sections('jfp-social-login');
      submit_button();
      ?>
    </form>
  </div>
  <?php
}

function jfp_sl_field_text($args) {
  $opts = get_option(JFP_SOCIAL_OPT, []);
  $key = $args['key'];
  $val = isset($opts[$key]) ? $opts[$key] : '';
  echo '<input type="text" class="regular-text" name="' . esc_attr(JFP_SOCIAL_OPT) . '[' . esc_attr($key) . ']" value="' . esc_attr($val) . '" />';
}

function jfp_sl_opts() {
  return get_option(JFP_SOCIAL_OPT, []);
}

function jfp_google_redirect_uri() {
  return admin_url('admin-post.php?action=jfp_google_callback');
}

function jfp_fb_redirect_uri() {
  return admin_url('admin-post.php?action=jfp_fb_callback');
}

function jfp_is_puzzle_page() {
  if (!is_singular()) return false;
  global $post;
  return $post && has_shortcode($post->post_content, 'jigsaw_puzzle');
}

function jfp_get_current_url_clean() {
  // Clean redirect_to if present
  $url = (is_singular() ? get_permalink() : home_url('/'));
  // If we're already on a singular, prefer the permalink (no query) to stay clean.
  return $url;
}

function jfp_ensure_player_role_exists() {
  if (!get_role('player')) {
    add_role('player', 'Player', ['read' => true]);
  }
}

function jfp_set_player_role($user_id) {
  jfp_ensure_player_role_exists();
  $u = get_user_by('id', $user_id);
  if (!$u) return;
  if (in_array('administrator', $u->roles, true)) return;
  // Set/force player role
  $u->set_role('player');
}

/**
 * Shortcode buttons: only show inside puzzle page.
 */
add_shortcode('jigsaw_social_login_buttons', function () {
  if (is_user_logged_in()) return '';

  $return = jfp_get_current_url_clean();
  $nonce  = wp_create_nonce('jfp_sl_state');

  $google_start = add_query_arg([
    'action'   => 'jfp_google_start',
    'return'   => $return,
    '_wpnonce' => $nonce,
  ], admin_url('admin-post.php'));

  $fb_start = add_query_arg([
    'action'   => 'jfp_fb_start',
    'return'   => $return,
    '_wpnonce' => $nonce,
  ], admin_url('admin-post.php'));

  ob_start();
  ?>
  <div class="jssl-buttons" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:12px 0;">
    <a class="button button-primary" href="<?php echo esc_url($fb_start); ?>">Continue with Facebook</a>
    <a class="button" href="<?php echo esc_url($google_start); ?>">Continue with Google</a>
  </div>
  <?php
  return ob_get_clean();
});// If someone visits puzzle with ?redirect_to=..., redirect to clean permalink
add_action('template_redirect', function () {
  if (!jfp_is_puzzle_page()) return;
  if (isset($_GET['redirect_to'])) {
    wp_safe_redirect(get_permalink(), 301);
    exit;
  }
}, 1);

// Block players from wp-admin (admin ok)
add_action('admin_init', function () {
  if (wp_doing_ajax()) return;
  if (!is_user_logged_in()) return;
  if (current_user_can('manage_options')) return;
  wp_safe_redirect(home_url('/'));
  exit;
});

// ------------------- Google OAuth (OIDC)
add_action('admin_post_nopriv_jfp_google_start', 'jfp_google_start');
add_action('admin_post_jfp_google_start', 'jfp_google_start');
function jfp_google_start() {
  if (!wp_verify_nonce($_GET['_wpnonce'] ?? '', 'jfp_sl_state')) { /* nonce can fail under full-page cache; continue */ }
  $return = isset($_GET['return']) ? esc_url_raw($_GET['return']) : '';
  $return = remove_query_arg(['redirect_to'], $return);
  if (!$return) $return = home_url('/');

  $state = wp_generate_password(24, false, false);
  set_transient('jfp_sl_return_' . $state, $return, 10 * MINUTE_IN_SECONDS);

  $opts = jfp_sl_opts();
  $client_id = $opts['google_client_id'] ?? '';
  if (!$client_id) wp_die('Google Client ID missing. Set it in Settings → JFP Social Login.');

  $auth = 'https://accounts.google.com/o/oauth2/v2/auth';
  $params = [
    'client_id'     => $client_id,
    'redirect_uri'  => jfp_google_redirect_uri(),
    'response_type' => 'code',
    'scope'         => 'openid email profile',
    'state'         => $state,
    'access_type'   => 'online',
    'prompt'        => 'select_account',
  ];
  wp_redirect($auth . '?' . http_build_query($params));
  exit;
}

add_action('admin_post_nopriv_jfp_google_callback', 'jfp_google_callback');
add_action('admin_post_jfp_google_callback', 'jfp_google_callback');
function jfp_google_callback() {
  $code  = $_GET['code'] ?? '';
  $state = $_GET['state'] ?? '';
  if (!$code || !$state) wp_die('Missing code/state');

  $return = get_transient('jfp_sl_return_' . $state);
  delete_transient('jfp_sl_return_' . $state);
  if (!$return) $return = home_url('/');

  $opts = jfp_sl_opts();
  $client_id = $opts['google_client_id'] ?? '';
  $client_secret = $opts['google_client_secret'] ?? '';
  if (!$client_id || !$client_secret) wp_die('Google credentials missing.');

  $token_res = wp_remote_post('https://oauth2.googleapis.com/token', [
    'timeout' => 20,
    'body' => [
      'code'          => $code,
      'client_id'     => $client_id,
      'client_secret' => $client_secret,
      'redirect_uri'  => jfp_google_redirect_uri(),
      'grant_type'    => 'authorization_code',
    ],
  ]);
  if (is_wp_error($token_res)) wp_die($token_res->get_error_message());
  $token_body = json_decode(wp_remote_retrieve_body($token_res), true);
  $access = $token_body['access_token'] ?? '';
  if (!$access) wp_die('Google token failed.');

  $ui_res = wp_remote_get('https://openidconnect.googleapis.com/v1/userinfo', [
    'timeout' => 20,
    'headers' => ['Authorization' => 'Bearer ' . $access],
  ]);
  if (is_wp_error($ui_res)) wp_die($ui_res->get_error_message());
  $ui = json_decode(wp_remote_retrieve_body($ui_res), true);

  $email = sanitize_email($ui['email'] ?? '');
  $sub   = sanitize_text_field($ui['sub'] ?? '');
  $name  = sanitize_text_field($ui['name'] ?? '');
  if (!$email || !$sub) wp_die('Google userinfo missing email/sub.');

  jfp_sl_login_or_create_user('google', $sub, $email, $name, $return);
}

// ------------------- Facebook OAuth
add_action('admin_post_nopriv_jfp_fb_start', 'jfp_fb_start');
add_action('admin_post_jfp_fb_start', 'jfp_fb_start');
function jfp_fb_start() {
  if (!wp_verify_nonce($_GET['_wpnonce'] ?? '', 'jfp_sl_state')) { /* nonce can fail under full-page cache; continue */ }
  $return = isset($_GET['return']) ? esc_url_raw($_GET['return']) : '';
  $return = remove_query_arg(['redirect_to'], $return);
  if (!$return) $return = home_url('/');

  $state = wp_generate_password(24, false, false);
  set_transient('jfp_sl_return_' . $state, $return, 10 * MINUTE_IN_SECONDS);

  $opts = jfp_sl_opts();
  $app_id = $opts['fb_app_id'] ?? '';
  if (!$app_id) wp_die('Facebook App ID missing. Set it in Settings → JFP Social Login.');

  $auth = 'https://www.facebook.com/v19.0/dialog/oauth';
  $params = [
    'client_id'     => $app_id,
    'redirect_uri'  => jfp_fb_redirect_uri(),
    'response_type' => 'code',
    'scope'         => 'email,public_profile',
    'state'         => $state,
  ];
  wp_redirect($auth . '?' . http_build_query($params));
  exit;
}

add_action('admin_post_nopriv_jfp_fb_callback', 'jfp_fb_callback');
add_action('admin_post_jfp_fb_callback', 'jfp_fb_callback');
function jfp_fb_callback() {
  $code  = $_GET['code'] ?? '';
  $state = $_GET['state'] ?? '';
  if (!$code || !$state) wp_die('Missing code/state');

  $return = get_transient('jfp_sl_return_' . $state);
  delete_transient('jfp_sl_return_' . $state);
  if (!$return) $return = home_url('/');

  $opts = jfp_sl_opts();
  $app_id = $opts['fb_app_id'] ?? '';
  $app_secret = $opts['fb_app_secret'] ?? '';
  if (!$app_id || !$app_secret) wp_die('Facebook credentials missing.');

  $token_url = add_query_arg([
    'client_id'     => $app_id,
    'redirect_uri'  => jfp_fb_redirect_uri(),
    'client_secret' => $app_secret,
    'code'          => $code,
  ], 'https://graph.facebook.com/v19.0/oauth/access_token');

  $token_res = wp_remote_get($token_url, ['timeout' => 20]);
  if (is_wp_error($token_res)) wp_die($token_res->get_error_message());
  $token_body = json_decode(wp_remote_retrieve_body($token_res), true);
  $access = $token_body['access_token'] ?? '';
  if (!$access) wp_die('Facebook token failed.');

  $me_url = add_query_arg([
    'fields'       => 'id,name,email',
    'access_token' => $access,
  ], 'https://graph.facebook.com/me');

  $me_res = wp_remote_get($me_url, ['timeout' => 20]);
  if (is_wp_error($me_res)) wp_die($me_res->get_error_message());
  $me = json_decode(wp_remote_retrieve_body($me_res), true);

  $id    = sanitize_text_field($me['id'] ?? '');
  $email = sanitize_email($me['email'] ?? '');
  $name  = sanitize_text_field($me['name'] ?? '');

  if (!$id) wp_die('Facebook userinfo missing id.');
  // Facebook đôi khi không trả email (tùy account/quyền). Fallback để tạo user.
  if (!$email) {
    $email = 'fb_' . $id . '@example.local';
  }

  jfp_sl_login_or_create_user('facebook', $id, $email, $name, $return);
}

function jfp_sl_login_or_create_user($provider, $provider_id, $email, $name, $return_url) {
  $meta_key = 'jfp_sl_' . $provider . '_id';

  // Find by provider id
  $users = get_users([
    'meta_key'    => $meta_key,
    'meta_value'  => $provider_id,
    'number'      => 1,
    'count_total' => false,
  ]);
  $user = $users ? $users[0] : null;

  // Else find by email
  if (!$user && $email) {
    $user = get_user_by('email', $email);
  }

  if (!$user) {
    $base = sanitize_user(($name ? $name : $provider) . '_' . wp_generate_password(6, false, false), true);
    $username = $base;
    $i = 1;
    while (username_exists($username)) {
      $username = $base . '_' . $i;
      $i++;
    }
    $pass = wp_generate_password(20, true, true);
    $user_id = wp_create_user($username, $pass, $email);
    if (is_wp_error($user_id)) {
      wp_die($user_id->get_error_message());
    }
    if ($name) {
      wp_update_user(['ID' => $user_id, 'display_name' => $name, 'nickname' => $name]);
    }
    update_user_meta($user_id, $meta_key, $provider_id);
    jfp_set_player_role($user_id);
    $user = get_user_by('id', $user_id);
  } else {
    if (!get_user_meta($user->ID, $meta_key, true)) {
      update_user_meta($user->ID, $meta_key, $provider_id);
    }
    jfp_set_player_role($user->ID);
  }

  // Login
  wp_clear_auth_cookie();
  wp_set_current_user($user->ID);
  wp_set_auth_cookie($user->ID, true);

  // Redirect back clean (no redirect_to)
  $clean = remove_query_arg(['redirect_to'], $return_url);
  wp_safe_redirect($clean);
  exit;
}
