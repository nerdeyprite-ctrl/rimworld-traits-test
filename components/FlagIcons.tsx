
import React from 'react';

export const KoreaFlag = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 24" className={className}>
        <rect width="36" height="24" fill="#fff" />
        <g transform="translate(18, 12) rotate(-33.69) scale(12)">
            <g fill="#c60c30">
                <path d="M0,0 a1,1 0 0,1 0.5,0.866 a0.5,0.5 0 0,0 0.5,-0.866 a1,1 0 0,1 -1,0 z" />
            </g>
            <g fill="#003478">
                <path d="M0,0 a1,1 0 0,0 -0.5,-0.866 a0.5,0.5 0 0,1 -0.5,0.866 a1,1 0 0,0 1,0 z" />
            </g>
        </g>
        <g transform="translate(6, 4) rotate(33.69)">
            <g id="k1" fill="#000">
                <rect x="-0.5" y="-6" width="1" height="12" />
                <rect x="1.5" y="-6" width="1" height="12" />
                <rect x="-2.5" y="-6" width="1" height="12" />
            </g>
        </g>
        <g transform="translate(30, 20) rotate(33.69)">
            <g fill="#000">
                <rect x="-0.5" y="-6" width="1" height="5.5" />
                <rect x="-0.5" y="0.5" width="1" height="5.5" />
                <rect x="1.5" y="-6" width="1" height="5.5" />
                <rect x="1.5" y="0.5" width="1" height="5.5" />
                <rect x="-2.5" y="-6" width="1" height="5.5" />
                <rect x="-2.5" y="0.5" width="1" height="5.5" />
            </g>
        </g>
        <g transform="translate(30, 4) rotate(-33.69)">
            <g fill="#000">
                <rect x="-0.5" y="-6" width="1" height="5.5" />
                <rect x="-0.5" y="0.5" width="1" height="5.5" />
                <rect x="1.5" y="-6" width="1" height="12" />
                <rect x="-2.5" y="-6" width="1" height="12" />
            </g>
        </g>
        <g transform="translate(6, 20) rotate(-33.69)">
            <g fill="#000">
                <rect x="-0.5" y="-6" width="1" height="12" />
                <rect x="1.5" y="-6" width="1" height="5.5" />
                <rect x="1.5" y="0.5" width="1" height="5.5" />
                <rect x="-2.5" y="-6" width="1" height="5.5" />
                <rect x="-2.5" y="0.5" width="1" height="5.5" />
            </g>
        </g>
    </svg>
);

export const USFlag = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7410 3900" className={className}>
        <rect width="7410" height="3900" fill="#b22234" />
        <path d="M0,450H7410M0,1350H7410M0,2250H7410M0,3150H7410" stroke="#fff" strokeWidth="300" />
        <rect width="2964" height="2100" fill="#3c3b6e" />
        <g fill="#fff">
            <g id="s18">
                <g id="s9">
                    <g id="s5">
                        <g id="s4">
                            <path id="s" d="M247,90 317.534,307.082 132.873,172.918H361.127L176.466,307.082z" />
                            <use xlinkHref="#s" x="494" />
                            <use xlinkHref="#s" x="988" />
                            <use xlinkHref="#s" x="1482" />
                        </g>
                        <use xlinkHref="#s" x="1976" />
                    </g>
                    <use xlinkHref="#s5" x="247" y="170" />
                </g>
                <use xlinkHref="#s9" y="340" />
            </g>
            <use xlinkHref="#s18" y="680" />
            <use xlinkHref="#s5" y="1020" />
            <use xlinkHref="#s4" x="247" y="1190" />
        </g>
    </svg>
);
