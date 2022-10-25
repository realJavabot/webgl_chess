# webgl_chess
Very optimised chess! Written in vanilla Javascript, the project utilizes WebGl to demo a playable chess board. Only valid moves are allowed, but outside of that there are no rules at the moment. This covers castleing and en passant. Rotate the board by click dragging, and move the pieces by clicking on them.

SSAA is implemented to give smoother graphics, and a vignette is demonstrated as an example of a post processing effect. The chess pieces are of the obj format since they are easy to parse. The pieces are drawn with minimal draw calls, and they take advantage of instancing.
