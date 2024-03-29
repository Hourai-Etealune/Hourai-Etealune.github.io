var LAppDefine = {
    
    // デバッグ。trueのときにログを表示する。
    DEBUG_LOG : false,
    //DEBUG_MOUSE_LOG : true, // マウス関連の冗長なログ
    // DEBUG_DRAW_HIT_AREA : false, // 当たり判定の可視化
    // DEBUG_DRAW_ALPHA_MODEL : false, // 半透明のモデル描画を行うかどうか。

    //  全体の設定
    
    // 画面
    VIEW_MAX_SCALE : 2,
    VIEW_MIN_SCALE : 0.8,

    VIEW_LOGICAL_LEFT : -1,
    VIEW_LOGICAL_RIGHT : 1,

    VIEW_LOGICAL_MAX_LEFT : -2,
    VIEW_LOGICAL_MAX_RIGHT : 2,
    VIEW_LOGICAL_MAX_BOTTOM : -2,
    VIEW_LOGICAL_MAX_TOP : 2,
    
    // モーションの優先度定数
    PRIORITY_NONE : 0,
    PRIORITY_IDLE : 1,
    PRIORITY_NORMAL : 2,
    PRIORITY_FORCE : 3,
    
    // モデルの後ろにある背景の画像ファイル
    BACK_IMAGE_NAME : "assets/image/back_class_normal.png",

    //  モデル定義
	  MODEL_HOURAI : "assets/live2d/chibi_hou/chibi_hou.model.json",

    // 外部定義ファイル(json)と合わせる
    MOTION_GROUP_IDLE : "idle", // アイドリング
};
